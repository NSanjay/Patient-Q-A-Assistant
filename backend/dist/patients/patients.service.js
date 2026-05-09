"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../common/entities");
let PatientsService = class PatientsService {
    patientRepo;
    allergyRepo;
    conditionRepo;
    medicationRepo;
    observationRepo;
    constructor(patientRepo, allergyRepo, conditionRepo, medicationRepo, observationRepo) {
        this.patientRepo = patientRepo;
        this.allergyRepo = allergyRepo;
        this.conditionRepo = conditionRepo;
        this.medicationRepo = medicationRepo;
        this.observationRepo = observationRepo;
    }
    async findByName(name, cohort) {
        const parts = name.trim().split(/\s+/);
        const query = this.patientRepo.createQueryBuilder('p')
            .where('p.group = :cohort', { cohort });
        if (parts.length >= 2) {
            query.andWhere('(LOWER(p.name_first) ILIKE :first AND LOWER(p.name_last) ILIKE :last) OR ' +
                '(LOWER(p.name_first) ILIKE :last AND LOWER(p.name_last) ILIKE :first)', { first: `%${parts[0].toLowerCase()}%`, last: `%${parts[parts.length - 1].toLowerCase()}%` });
        }
        else {
            query.andWhere('(LOWER(p.name_first) ILIKE :term OR LOWER(p.name_last) ILIKE :term)', { term: `%${parts[0].toLowerCase()}%` });
        }
        return query.getMany();
    }
    async findByRoom(room, bed, cohort) {
        const query = this.patientRepo.createQueryBuilder('p')
            .where('p.group = :cohort', { cohort })
            .andWhere('p.room_description = :room', { room });
        if (bed)
            query.andWhere('LOWER(p.bed_description) = LOWER(:bed)', { bed });
        return query.getMany();
    }
    async findByUnit(unit, cohort) {
        return this.patientRepo.createQueryBuilder('p')
            .where('p.group = :cohort', { cohort })
            .andWhere('LOWER(p.unit_description) ILIKE :unit', { unit: `%${unit.toLowerCase()}%` })
            .getMany();
    }
    async findByDemographics(gender, ethnicity, cohort) {
        const query = this.patientRepo.createQueryBuilder('p')
            .where('p.group = :cohort', { cohort });
        if (gender)
            query.andWhere('LOWER(p.gender) = LOWER(:gender)', { gender });
        if (ethnicity)
            query.andWhere('LOWER(p.ethnicity_description) ILIKE :ethnicity', { ethnicity: `%${ethnicity.toLowerCase()}%` });
        return query.getMany();
    }
    async findByMedication(term, cohort) {
        const results = await this.medicationRepo.createQueryBuilder('m')
            .innerJoin(entities_1.Patient, 'p', 'p.id = m.patient_id')
            .where('p.group = :cohort', { cohort })
            .andWhere('(LOWER(m.description) ILIKE :term OR LOWER(m.generic_name) ILIKE :term)', { term: `%${term.toLowerCase()}%` })
            .select('m.patient_id', 'patient_id')
            .distinct(true)
            .getRawMany();
        if (!results.length)
            return [];
        const ids = results.map(r => r.patient_id);
        return this.patientRepo.createQueryBuilder('p')
            .where('p.id IN (:...ids)', { ids })
            .andWhere('p.group = :cohort', { cohort })
            .getMany();
    }
    async findByCondition(term, cohort) {
        const results = await this.conditionRepo.createQueryBuilder('c')
            .innerJoin(entities_1.Patient, 'p', 'p.id = c.patient_id')
            .where('p.group = :cohort', { cohort })
            .andWhere('LOWER(c.icd_10_description) ILIKE :term', { term: `%${term.toLowerCase()}%` })
            .select('c.patient_id', 'patient_id')
            .distinct(true)
            .getRawMany();
        if (!results.length)
            return [];
        const ids = results.map(r => r.patient_id);
        return this.patientRepo.createQueryBuilder('p')
            .where('p.id IN (:...ids)', { ids })
            .andWhere('p.group = :cohort', { cohort })
            .getMany();
    }
    async findByAllergen(term, cohort) {
        const results = await this.allergyRepo.createQueryBuilder('a')
            .innerJoin(entities_1.Patient, 'p', 'p.id = a.patient_id')
            .where('p.group = :cohort', { cohort })
            .andWhere('LOWER(a.allergen) ILIKE :term', { term: `%${term.toLowerCase()}%` })
            .select('a.patient_id', 'patient_id')
            .distinct(true)
            .getRawMany();
        if (!results.length)
            return [];
        const ids = results.map(r => r.patient_id);
        return this.patientRepo.createQueryBuilder('p')
            .where('p.id IN (:...ids)', { ids })
            .andWhere('p.group = :cohort', { cohort })
            .getMany();
    }
    async getById(id, cohort) {
        return this.patientRepo.findOne({ where: { id, group: cohort } });
    }
    async listAll(cohort) {
        return this.patientRepo.find({ where: { group: cohort } });
    }
    async getAllRecords(patientId, cohort) {
        const patient = await this.getById(patientId, cohort);
        if (!patient)
            return null;
        const [allergies, conditions, medications, observations] = await Promise.all([
            this.allergyRepo.find({ where: { patient_id: patientId } }),
            this.conditionRepo.find({ where: { patient_id: patientId } }),
            this.medicationRepo.find({ where: { patient_id: patientId } }),
            this.observationRepo.find({ where: { patient_id: patientId } }),
        ]);
        return { patient, allergies, conditions, medications, observations };
    }
    async getLatestObservations(patientId, cohort) {
        const patient = await this.getById(patientId, cohort);
        if (!patient)
            return null;
        const obs = await this.observationRepo
            .createQueryBuilder('o')
            .where('o.patient_id = :patientId', { patientId })
            .orderBy('o.recorded_time', 'DESC')
            .getMany();
        const seen = new Set();
        const latest = obs.filter(o => {
            const type = o.data?.type;
            if (!type || seen.has(type))
                return false;
            seen.add(type);
            return true;
        });
        return { patient, observations: latest };
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Patient)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.PatientAllergy)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.PatientCondition)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.PatientMedication)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.PatientObservation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PatientsService);
//# sourceMappingURL=patients.service.js.map