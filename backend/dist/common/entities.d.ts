export declare class Patient {
    id: string;
    name_first: string;
    name_last: string;
    dob: Date;
    gender: string;
    ethnicity_description: string;
    legal_mailing_address: any;
    unit_description: string;
    floor_description: string;
    room_description: string;
    bed_description: string;
    status: string;
    admission_time: Date;
    discharge_time: Date;
    death_time: Date;
    email: string;
    phone: string;
    outpatient: boolean;
    on_leave: boolean;
    group: string;
}
export declare class PatientAllergy {
    id: string;
    patient_id: string;
    allergen: string;
    category: string;
    clinical_status: string;
    onset_date: Date;
    reaction_note: string;
    reaction_type: string;
    reaction_sub_type: string;
    severity: string;
    type: string;
}
export declare class PatientCondition {
    id: string;
    patient_id: string;
    clinical_status: string;
    icd_10_code: string;
    icd_10_description: string;
    onset_date: Date;
    is_primary_diagnosis: boolean;
    resolved_date: Date;
}
export declare class PatientMedication {
    id: string;
    patient_id: string;
    description: string;
    directions: string;
    generic_name: string;
    narcotic: boolean;
    start_time: Date;
    status: string;
    strength: string;
    strength_unit: string;
}
export declare class PatientObservation {
    id: string;
    patient_id: string;
    method: string;
    recorded_time: Date;
    data: any;
}
export declare class RequestLog {
    id: string;
    created_at: Date;
    cohort: string;
    session_id: string;
    prompt_variant: string;
    raw_query: string;
    resolved_patient_id: string;
    records_retrieved: any;
    raw_model_output: string;
    answer: string;
    citations: any;
    confidence: string;
    injection_detected: boolean;
    injection_details: string;
    cohort_violation: boolean;
}
