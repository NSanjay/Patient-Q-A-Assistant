import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Patient, PatientAllergy, PatientCondition,
  PatientMedication, PatientObservation
} from '../common/entities';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient) private patientRepo: Repository<Patient>,
    @InjectRepository(PatientAllergy) private allergyRepo: Repository<PatientAllergy>,
    @InjectRepository(PatientCondition) private conditionRepo: Repository<PatientCondition>,
    @InjectRepository(PatientMedication) private medicationRepo: Repository<PatientMedication>,
    @InjectRepository(PatientObservation) private observationRepo: Repository<PatientObservation>,
  ) {}

  async findByName(name: string, cohort: string): Promise<Patient[]> {
    const parts = name.trim().split(/\s+/);
    const query = this.patientRepo.createQueryBuilder('p')
      .where('p.group = :cohort', { cohort });
    if (parts.length >= 2) {
      query.andWhere(
        '(LOWER(p.name_first) ILIKE :first AND LOWER(p.name_last) ILIKE :last) OR ' +
        '(LOWER(p.name_first) ILIKE :last AND LOWER(p.name_last) ILIKE :first)',
        { first: `%${parts[0].toLowerCase()}%`, last: `%${parts[parts.length - 1].toLowerCase()}%` }
      );
    } else {
      query.andWhere(
        '(LOWER(p.name_first) ILIKE :term OR LOWER(p.name_last) ILIKE :term)',
        { term: `%${parts[0].toLowerCase()}%` }
      );
    }
    return query.getMany();
  }

  async findByRoom(room: string, bed: string | null, cohort: string): Promise<Patient[]> {
    const query = this.patientRepo.createQueryBuilder('p')
      .where('p.group = :cohort', { cohort })
      .andWhere('p.room_description = :room', { room });
    if (bed) query.andWhere('LOWER(p.bed_description) = LOWER(:bed)', { bed });
    return query.getMany();
  }

  async findByUnit(unit: string, cohort: string): Promise<Patient[]> {
    return this.patientRepo.createQueryBuilder('p')
      .where('p.group = :cohort', { cohort })
      .andWhere('LOWER(p.unit_description) ILIKE :unit', { unit: `%${unit.toLowerCase()}%` })
      .getMany();
  }

  async findByDemographics(gender: string | null, ethnicity: string | null, cohort: string): Promise<Patient[]> {
    const query = this.patientRepo.createQueryBuilder('p')
      .where('p.group = :cohort', { cohort });
    if (gender) query.andWhere('LOWER(p.gender) = LOWER(:gender)', { gender });
    if (ethnicity) query.andWhere('LOWER(p.ethnicity_description) ILIKE :ethnicity', { ethnicity: `%${ethnicity.toLowerCase()}%` });
    return query.getMany();
  }

  async findByMedication(term: string, cohort: string): Promise<Patient[]> {
    const results = await this.medicationRepo.createQueryBuilder('m')
      .innerJoin(Patient, 'p', 'p.id = m.patient_id')
      .where('p.group = :cohort', { cohort })
      .andWhere(
        '(LOWER(m.description) ILIKE :term OR LOWER(m.generic_name) ILIKE :term)',
        { term: `%${term.toLowerCase()}%` }
      )
      .select('m.patient_id', 'patient_id')
      .distinct(true)
      .getRawMany();
    if (!results.length) return [];
    const ids = results.map(r => r.patient_id);
    return this.patientRepo.createQueryBuilder('p')
      .where('p.id IN (:...ids)', { ids })
      .andWhere('p.group = :cohort', { cohort })
      .getMany();
  }

  async findByCondition(term: string, cohort: string): Promise<Patient[]> {
    const results = await this.conditionRepo.createQueryBuilder('c')
      .innerJoin(Patient, 'p', 'p.id = c.patient_id')
      .where('p.group = :cohort', { cohort })
      .andWhere('LOWER(c.icd_10_description) ILIKE :term', { term: `%${term.toLowerCase()}%` })
      .select('c.patient_id', 'patient_id')
      .distinct(true)
      .getRawMany();
    if (!results.length) return [];
    const ids = results.map(r => r.patient_id);
    return this.patientRepo.createQueryBuilder('p')
      .where('p.id IN (:...ids)', { ids })
      .andWhere('p.group = :cohort', { cohort })
      .getMany();
  }

  async findByAllergen(term: string, cohort: string): Promise<Patient[]> {
    const results = await this.allergyRepo.createQueryBuilder('a')
      .innerJoin(Patient, 'p', 'p.id = a.patient_id')
      .where('p.group = :cohort', { cohort })
      .andWhere('LOWER(a.allergen) ILIKE :term', { term: `%${term.toLowerCase()}%` })
      .select('a.patient_id', 'patient_id')
      .distinct(true)
      .getRawMany();
    if (!results.length) return [];
    const ids = results.map(r => r.patient_id);
    return this.patientRepo.createQueryBuilder('p')
      .where('p.id IN (:...ids)', { ids })
      .andWhere('p.group = :cohort', { cohort })
      .getMany();
  }

  async getById(id: string, cohort: string): Promise<Patient | null> {
    return this.patientRepo.findOne({ where: { id, group: cohort } });
  }

  async listAll(cohort: string): Promise<Patient[]> {
    return this.patientRepo.find({ where: { group: cohort } });
  }

  async getAllRecords(patientId: string, cohort: string) {
    // Critical: verify patient belongs to cohort before returning anything
    const patient = await this.getById(patientId, cohort);
    if (!patient) return null;

    const [allergies, conditions, medications, observations] = await Promise.all([
      this.allergyRepo.find({ where: { patient_id: patientId } }),
      this.conditionRepo.find({ where: { patient_id: patientId } }),
      this.medicationRepo.find({ where: { patient_id: patientId } }),
      this.observationRepo.find({ where: { patient_id: patientId } }),
    ]);

    return { patient, allergies, conditions, medications, observations };
  }

  async getLatestObservations(patientId: string, cohort: string) {
    const patient = await this.getById(patientId, cohort);
    if (!patient) return null;

    const obs = await this.observationRepo
      .createQueryBuilder('o')
      .where('o.patient_id = :patientId', { patientId })
      .orderBy('o.recorded_time', 'DESC')
      .getMany();

    const seen = new Set<string>();
    const latest = obs.filter(o => {
      const type = o.data?.type;
      if (!type || seen.has(type)) return false;
      seen.add(type);
      return true;
    });

    return { patient, observations: latest };
  }
}
