import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsService } from './patients.service';
import {
  Patient, PatientAllergy, PatientCondition,
  PatientMedication, PatientObservation
} from '../common/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Patient, PatientAllergy, PatientCondition,
      PatientMedication, PatientObservation
    ]),
  ],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
