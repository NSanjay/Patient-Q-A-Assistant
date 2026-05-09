CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS patient (
  id UUID PRIMARY KEY,
  name_first TEXT,
  name_last TEXT,
  dob DATE,
  gender TEXT,
  ethnicity_description TEXT,
  legal_mailing_address JSONB,
  unit_description TEXT,
  floor_description TEXT,
  room_description TEXT,
  bed_description TEXT,
  status TEXT,
  admission_time TIMESTAMPTZ,
  discharge_time TIMESTAMPTZ,
  death_time TIMESTAMPTZ,
  email TEXT,
  phone TEXT,
  outpatient BOOLEAN,
  rev_by TEXT,
  rev_time TIMESTAMPTZ,
  on_leave BOOLEAN,
  "group" CHAR(1) NOT NULL
);

CREATE TABLE IF NOT EXISTS patient_allergy (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patient(id),
  allergen TEXT,
  category TEXT,
  clinical_status TEXT,
  created_by TEXT,
  created_time TIMESTAMPTZ,
  onset_date DATE,
  reaction_note TEXT,
  reaction_type TEXT,
  reaction_sub_type TEXT,
  resolved_date DATE,
  rev_by TEXT,
  rev_time TIMESTAMPTZ,
  severity TEXT,
  type TEXT
);

CREATE TABLE IF NOT EXISTS patient_condition (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patient(id),
  clinical_status TEXT,
  created_by TEXT,
  created_time TIMESTAMPTZ,
  icd_10_code TEXT,
  icd_10_description TEXT,
  onset_date DATE,
  is_primary_diagnosis BOOLEAN,
  resolved_date DATE,
  rev_by TEXT,
  rev_time TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS patient_medication (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patient(id),
  created_time TIMESTAMPTZ,
  description TEXT,
  directions TEXT,
  generic_name TEXT,
  narcotic BOOLEAN,
  order_time TIMESTAMPTZ,
  rev_time TIMESTAMPTZ,
  rx_norm_id TEXT,
  start_time DATE,
  status TEXT,
  strength TEXT,
  strength_unit TEXT
);

CREATE TABLE IF NOT EXISTS patient_observation (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patient(id),
  method TEXT,
  recorded_by TEXT,
  recorded_time TIMESTAMPTZ,
  data JSONB
);

CREATE TABLE IF NOT EXISTS request_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  cohort CHAR(1),
  session_id TEXT,
  prompt_variant TEXT,
  raw_query TEXT,
  resolved_patient_id UUID,
  records_retrieved JSONB,
  raw_model_output TEXT,
  answer TEXT,
  citations JSONB,
  confidence TEXT,
  injection_detected BOOLEAN DEFAULT FALSE,
  injection_details TEXT,
  cohort_violation BOOLEAN DEFAULT FALSE
);

-- Indexes for fast cohort-scoped lookups
CREATE INDEX IF NOT EXISTS idx_patient_group ON patient("group");
CREATE INDEX IF NOT EXISTS idx_patient_name ON patient(name_first, name_last);
CREATE INDEX IF NOT EXISTS idx_patient_room ON patient(room_description);
CREATE INDEX IF NOT EXISTS idx_allergy_patient ON patient_allergy(patient_id);
CREATE INDEX IF NOT EXISTS idx_condition_patient ON patient_condition(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_patient ON patient_medication(patient_id);
CREATE INDEX IF NOT EXISTS idx_observation_patient ON patient_observation(patient_id);
CREATE INDEX IF NOT EXISTS idx_log_cohort ON request_log(cohort);
CREATE INDEX IF NOT EXISTS idx_log_session ON request_log(session_id);
