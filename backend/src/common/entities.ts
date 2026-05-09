import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('patient')
export class Patient {
  @PrimaryColumn('uuid') id: string;
  @Column({ nullable: true }) name_first: string;
  @Column({ nullable: true }) name_last: string;
  @Column({ nullable: true }) dob: Date;
  @Column({ nullable: true }) gender: string;
  @Column({ nullable: true }) ethnicity_description: string;
  @Column({ type: 'jsonb', nullable: true }) legal_mailing_address: any;
  @Column({ nullable: true }) unit_description: string;
  @Column({ nullable: true }) floor_description: string;
  @Column({ nullable: true }) room_description: string;
  @Column({ nullable: true }) bed_description: string;
  @Column({ nullable: true }) status: string;
  @Column({ nullable: true }) admission_time: Date;
  @Column({ nullable: true }) discharge_time: Date;
  @Column({ nullable: true }) death_time: Date;
  @Column({ nullable: true }) email: string;
  @Column({ nullable: true }) phone: string;
  @Column({ nullable: true }) outpatient: boolean;
  @Column({ nullable: true }) on_leave: boolean;
  @Column({ name: 'group', length: 1 }) group: string;
}

@Entity('patient_allergy')
export class PatientAllergy {
  @PrimaryColumn('uuid') id: string;
  @Column('uuid') patient_id: string;
  @Column({ nullable: true }) allergen: string;
  @Column({ nullable: true }) category: string;
  @Column({ nullable: true }) clinical_status: string;
  @Column({ nullable: true }) onset_date: Date;
  @Column({ nullable: true }) reaction_note: string;
  @Column({ nullable: true }) reaction_type: string;
  @Column({ nullable: true }) reaction_sub_type: string;
  @Column({ nullable: true }) severity: string;
  @Column({ nullable: true }) type: string;
}

@Entity('patient_condition')
export class PatientCondition {
  @PrimaryColumn('uuid') id: string;
  @Column('uuid') patient_id: string;
  @Column({ nullable: true }) clinical_status: string;
  @Column({ nullable: true }) icd_10_code: string;
  @Column({ nullable: true }) icd_10_description: string;
  @Column({ nullable: true }) onset_date: Date;
  @Column({ nullable: true }) is_primary_diagnosis: boolean;
  @Column({ nullable: true }) resolved_date: Date;
}

@Entity('patient_medication')
export class PatientMedication {
  @PrimaryColumn('uuid') id: string;
  @Column('uuid') patient_id: string;
  @Column({ nullable: true }) description: string;
  @Column({ nullable: true }) directions: string;
  @Column({ nullable: true }) generic_name: string;
  @Column({ nullable: true }) narcotic: boolean;
  @Column({ nullable: true }) start_time: Date;
  @Column({ nullable: true }) status: string;
  @Column({ nullable: true }) strength: string;
  @Column({ nullable: true }) strength_unit: string;
}

@Entity('patient_observation')
export class PatientObservation {
  @PrimaryColumn('uuid') id: string;
  @Column('uuid') patient_id: string;
  @Column({ nullable: true }) method: string;
  @Column({ nullable: true }) recorded_time: Date;
  @Column({ type: 'jsonb', nullable: true }) data: any;
}

@Entity('request_log')
export class RequestLog {
  @PrimaryColumn('uuid') id: string;
  @CreateDateColumn() created_at: Date;
  @Column({ nullable: true, length: 1 }) cohort: string;
  @Column({ nullable: true }) session_id: string;
  @Column({ nullable: true }) prompt_variant: string;
  @Column({ nullable: true }) raw_query: string;
  @Column({ nullable: true, type: 'text' }) resolved_patient_id: string;
  @Column({ type: 'jsonb', nullable: true }) records_retrieved: any;
  @Column({ nullable: true, type: 'text' }) raw_model_output: string;
  @Column({ nullable: true, type: 'text' }) answer: string;
  @Column({ type: 'jsonb', nullable: true }) citations: any;
  @Column({ nullable: true }) confidence: string;
  @Column({ default: false }) injection_detected: boolean;
  @Column({ nullable: true, type: 'text' }) injection_details: string;
  @Column({ default: false }) cohort_violation: boolean;
}
