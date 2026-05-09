import { Repository } from 'typeorm';
import { Patient, PatientAllergy, PatientCondition, PatientMedication, PatientObservation } from '../common/entities';
export declare class PatientsService {
    private patientRepo;
    private allergyRepo;
    private conditionRepo;
    private medicationRepo;
    private observationRepo;
    constructor(patientRepo: Repository<Patient>, allergyRepo: Repository<PatientAllergy>, conditionRepo: Repository<PatientCondition>, medicationRepo: Repository<PatientMedication>, observationRepo: Repository<PatientObservation>);
    findByName(name: string, cohort: string): Promise<Patient[]>;
    findByRoom(room: string, bed: string | null, cohort: string): Promise<Patient[]>;
    findByUnit(unit: string, cohort: string): Promise<Patient[]>;
    findByDemographics(gender: string | null, ethnicity: string | null, cohort: string): Promise<Patient[]>;
    findByMedication(term: string, cohort: string): Promise<Patient[]>;
    findByCondition(term: string, cohort: string): Promise<Patient[]>;
    findByAllergen(term: string, cohort: string): Promise<Patient[]>;
    getById(id: string, cohort: string): Promise<Patient | null>;
    listAll(cohort: string): Promise<Patient[]>;
    getAllRecords(patientId: string, cohort: string): Promise<{
        patient: Patient;
        allergies: PatientAllergy[];
        conditions: PatientCondition[];
        medications: PatientMedication[];
        observations: PatientObservation[];
    } | null>;
    getLatestObservations(patientId: string, cohort: string): Promise<{
        patient: Patient;
        observations: PatientObservation[];
    } | null>;
}
