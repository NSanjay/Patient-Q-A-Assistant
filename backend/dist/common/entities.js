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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestLog = exports.PatientObservation = exports.PatientMedication = exports.PatientCondition = exports.PatientAllergy = exports.Patient = void 0;
const typeorm_1 = require("typeorm");
let Patient = class Patient {
    id;
    name_first;
    name_last;
    dob;
    gender;
    ethnicity_description;
    legal_mailing_address;
    unit_description;
    floor_description;
    room_description;
    bed_description;
    status;
    admission_time;
    discharge_time;
    death_time;
    email;
    phone;
    outpatient;
    on_leave;
    group;
};
exports.Patient = Patient;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], Patient.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "name_first", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "name_last", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Patient.prototype, "dob", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "ethnicity_description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Patient.prototype, "legal_mailing_address", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "unit_description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "floor_description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "room_description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "bed_description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Patient.prototype, "admission_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Patient.prototype, "discharge_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Patient.prototype, "death_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Boolean)
], Patient.prototype, "outpatient", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Boolean)
], Patient.prototype, "on_leave", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'group', length: 1 }),
    __metadata("design:type", String)
], Patient.prototype, "group", void 0);
exports.Patient = Patient = __decorate([
    (0, typeorm_1.Entity)('patient')
], Patient);
let PatientAllergy = class PatientAllergy {
    id;
    patient_id;
    allergen;
    category;
    clinical_status;
    onset_date;
    reaction_note;
    reaction_type;
    reaction_sub_type;
    severity;
    type;
};
exports.PatientAllergy = PatientAllergy;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], PatientAllergy.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], PatientAllergy.prototype, "patient_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PatientAllergy.prototype, "allergen", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PatientAllergy.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PatientAllergy.prototype, "clinical_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], PatientAllergy.prototype, "onset_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PatientAllergy.prototype, "reaction_note", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PatientAllergy.prototype, "reaction_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PatientAllergy.prototype, "reaction_sub_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PatientAllergy.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PatientAllergy.prototype, "type", void 0);
exports.PatientAllergy = PatientAllergy = __decorate([
    (0, typeorm_1.Entity)('patient_allergy')
], PatientAllergy);
let PatientCondition = class PatientCondition {
    id;
    patient_id;
    clinical_status;
    icd_10_code;
    icd_10_description;
    onset_date;
    is_primary_diagnosis;
    resolved_date;
};
exports.PatientCondition = PatientCondition;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], PatientCondition.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], PatientCondition.prototype, "patient_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PatientCondition.prototype, "clinical_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PatientCondition.prototype, "icd_10_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PatientCondition.prototype, "icd_10_description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], PatientCondition.prototype, "onset_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Boolean)
], PatientCondition.prototype, "is_primary_diagnosis", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], PatientCondition.prototype, "resolved_date", void 0);
exports.PatientCondition = PatientCondition = __decorate([
    (0, typeorm_1.Entity)('patient_condition')
], PatientCondition);
let PatientMedication = class PatientMedication {
    id;
    patient_id;
    description;
    directions;
    generic_name;
    narcotic;
    start_time;
    status;
    strength;
    strength_unit;
};
exports.PatientMedication = PatientMedication;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], PatientMedication.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], PatientMedication.prototype, "patient_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PatientMedication.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PatientMedication.prototype, "directions", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PatientMedication.prototype, "generic_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Boolean)
], PatientMedication.prototype, "narcotic", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], PatientMedication.prototype, "start_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PatientMedication.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PatientMedication.prototype, "strength", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PatientMedication.prototype, "strength_unit", void 0);
exports.PatientMedication = PatientMedication = __decorate([
    (0, typeorm_1.Entity)('patient_medication')
], PatientMedication);
let PatientObservation = class PatientObservation {
    id;
    patient_id;
    method;
    recorded_time;
    data;
};
exports.PatientObservation = PatientObservation;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], PatientObservation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], PatientObservation.prototype, "patient_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PatientObservation.prototype, "method", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], PatientObservation.prototype, "recorded_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PatientObservation.prototype, "data", void 0);
exports.PatientObservation = PatientObservation = __decorate([
    (0, typeorm_1.Entity)('patient_observation')
], PatientObservation);
let RequestLog = class RequestLog {
    id;
    created_at;
    cohort;
    session_id;
    prompt_variant;
    raw_query;
    resolved_patient_id;
    records_retrieved;
    raw_model_output;
    answer;
    citations;
    confidence;
    injection_detected;
    injection_details;
    cohort_violation;
};
exports.RequestLog = RequestLog;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], RequestLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RequestLog.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 1 }),
    __metadata("design:type", String)
], RequestLog.prototype, "cohort", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], RequestLog.prototype, "session_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], RequestLog.prototype, "prompt_variant", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], RequestLog.prototype, "raw_query", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], RequestLog.prototype, "resolved_patient_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], RequestLog.prototype, "records_retrieved", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], RequestLog.prototype, "raw_model_output", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], RequestLog.prototype, "answer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], RequestLog.prototype, "citations", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], RequestLog.prototype, "confidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], RequestLog.prototype, "injection_detected", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], RequestLog.prototype, "injection_details", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], RequestLog.prototype, "cohort_violation", void 0);
exports.RequestLog = RequestLog = __decorate([
    (0, typeorm_1.Entity)('request_log')
], RequestLog);
//# sourceMappingURL=entities.js.map