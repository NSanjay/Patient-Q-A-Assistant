"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const patients_service_1 = require("./patients.service");
const entities_1 = require("../common/entities");
let PatientsModule = class PatientsModule {
};
exports.PatientsModule = PatientsModule;
exports.PatientsModule = PatientsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.Patient, entities_1.PatientAllergy, entities_1.PatientCondition,
                entities_1.PatientMedication, entities_1.PatientObservation
            ]),
        ],
        providers: [patients_service_1.PatientsService],
        exports: [patients_service_1.PatientsService],
    })
], PatientsModule);
//# sourceMappingURL=patients.module.js.map