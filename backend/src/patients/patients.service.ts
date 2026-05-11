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

  async existsInOtherCohort(name: string, cohort: string): Promise<boolean> {
    const parts = name.trim().split(/\s+/);
    if (parts.length < 2) return false; // single words not supported

    const otherCohort = cohort === 'A' ? 'B' : 'A';
    const count = await this.patientRepo.createQueryBuilder('p')
      .where('p.group = :otherCohort', { otherCohort })
      .andWhere(
        `(LOWER(p.name_first) = LOWER(:first) AND LOWER(p.name_last) = LOWER(:last))
         OR (LOWER(p.name_first) = LOWER(:last) AND LOWER(p.name_last) = LOWER(:first))`,
        { first: parts[0], last: parts[parts.length - 1] }
      )
      .getCount();
    return count > 0;
  }

  // REPLACE findByName with this:
  async findByName(name: string, cohort: string): Promise<Patient[]> {
    const parts = name.trim().split(/\s+/);
    const query = this.patientRepo.createQueryBuilder('p')
      .where('p.group = :cohort', { cohort });

    if (parts.length >= 2) {
      // Full name: exact word match on both first and last
      query.andWhere(
        `(
          (LOWER(p.name_first) = LOWER(:first) AND LOWER(p.name_last) = LOWER(:last))
          OR
          (LOWER(p.name_first) = LOWER(:last) AND LOWER(p.name_last) = LOWER(:first))
        )`,
        { first: parts[0], last: parts[parts.length - 1] }
      );
    } else {
      // Single word: exact match only, no substring matching
      query.andWhere(
        '(LOWER(p.name_first) = LOWER(:term) OR LOWER(p.name_last) = LOWER(:term))',
        { term: parts[0] }
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

  // ── Explode JSONB observation data into flat readable fields ─────────────
  private explodeObservations(observations: PatientObservation[]): any[] {
    const byType = new Map<string, {
      value: any; unit: any; recorded_time: Date;
      method: string; recorded_by: string;
      systolicValue?: any; diastolicValue?: any;
    }>();

    for (const obs of observations) {
      const d = obs.data ?? {};
      const type = d.type ?? 'Unknown';
      const existing = byType.get(type);

      if (!existing || (obs.recorded_time && obs.recorded_time > existing.recorded_time)) {
        byType.set(type, {
          // Handle BP which has systolic/diastolic instead of value
          value: d.value ?? null,
          systolicValue: d.systolicValue ?? null,
          diastolicValue: d.diastolicValue ?? null,
          unit: d.unit ?? null,
          recorded_time: obs.recorded_time,
          method: obs.method ?? '',
          recorded_by: obs.recorded_by ?? '',  // ← from row, not JSONB
        });
      }
    }

    return Array.from(byType.entries()).map(([type, data]) => {
      // Build human-readable summary depending on observation type
      let summary: string;
      let displayValue: any;

      if (type === 'BloodPressure' && data.systolicValue != null && data.diastolicValue != null) {
        displayValue = `${data.systolicValue}/${data.diastolicValue}`;
        summary = `BloodPressure: ${displayValue}${data.unit ? ' ' + data.unit : ''}`;
      } else {
        displayValue = data.value;
        summary = `${type}: ${data.value}${data.unit ? ' ' + data.unit : ''}`;
      }

      return {
        observation_type: type,
        value: displayValue,
        unit: data.unit,
        systolic_value: data.systolicValue,   // keep raw fields too for citations
        diastolic_value: data.diastolicValue,
        recorded_time: data.recorded_time,
        method: data.method,
        recorded_by: data.recorded_by,        // ← now included
        summary,
      };
    });
  }

  // ── Explode address JSONB into flat fields ───────────────────────────────
  private explodeAddress(patient: Patient): any {
    const addr = patient.legal_mailing_address ?? {};
    return {
      ...patient,
      address_line1: addr.line1 ?? null,
      address_city: addr.city ?? null,
      address_state: addr.state ?? null,
      address_postal_code: addr.postalCode ?? null,
      address_country: addr.country ?? null,
      legal_mailing_address: undefined, // remove raw JSONB
    };
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

    return {
      patient: this.explodeAddress(patient),
      allergies,
      conditions,
      medications,
      // Exploded — LLM sees "BloodPressure: 120/80 mmHg" not raw JSONB
      observations: this.explodeObservations(observations),
    };
  }

  async getLatestObservations(patientId: string, cohort: string) {
    const patient = await this.getById(patientId, cohort);
    if (!patient) return null;

    const obs = await this.observationRepo
      .createQueryBuilder('o')
      .where('o.patient_id = :patientId', { patientId })
      .orderBy('o.recorded_time', 'DESC')
      .getMany();

    return {
      patient: this.explodeAddress(patient),
      observations: this.explodeObservations(obs),
    };
  }
}
