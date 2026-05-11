import { eng } from "stopword";
const stopWords = new Set(eng);

// TABLE CONSTANTS
export const TABLE_METADATA = {
  patient: {
    description: 'Core patient demographics, location, admission info',
    usefulFor: ['room location', 'demographics', 'admission status', 'basic info', 'contact'],
  },
  patient_condition: {
    description: 'Diagnoses and medical conditions with ICD-10 codes',
    usefulFor: ['diagnoses', 'conditions', 'medical history', 'primary diagnosis'],
  },
  patient_medication: {
    description: 'Current and past medications, dosage, directions',
    usefulFor: ['medications', 'drugs', 'prescriptions', 'treatments', 'narcotics'],
  },
  patient_observation: {
    description: 'Vital signs: BloodPressure, HeartRate, Temperature, Weight, Height, OxygenSaturation, RespiratoryRate, BloodSugar, PainLevel',
    usefulFor: ['vitals', 'observations', 'blood pressure', 'heart rate', 'temperature', 'weight', 'oxygen', 'pain'],
  },
  patient_allergy: {
    description: 'Known allergies, reactions, severity',
    usefulFor: ['allergies', 'allergens', 'reactions', 'drug allergies'],
  },
};

// MODEL ANSWERS
export const SAFE_FALLBACK_ANSWER = 'I cannot find a matching patient in your cohort, or I cannot answer this question based on the available records.'
export const INJECTION_FALLBACK_ANSWER = 'I cannot process that request.';

// MEDICAL TERMS - Lightweight curated whitelist
export const KNOWN_MEDICATIONS = new Set([
    'metformin',
    'insulin',
    'lisinopril',
    'atorvastatin',
    'warfarin',
    'levothyroxine',
    'amlodipine',
    'omeprazole',
    'losartan',
    'gabapentin',
    'finasteride',
    'aspirin',
    'ibuprofen',
    'acetaminophen',
    'amoxicillin',
    'azithromycin',
  ]);
export const CONDITION_TERMS = [
    'diabetes',
    'diabetic',
    'hypertension',
    'heart failure',
    'cardiac',
    'kidney',
    'renal',
    'cancer',
    'depression',
    'anxiety',
    'copd',
    'asthma',
    'stroke',
    'dementia',
    'alzheimer',
    'pneumonia',
    'sepsis',
    'anemia',
    'obesity',
    'arthritis',
    'fracture',
    'infection',
  ];

// COMMON WORDS
export const COMMON_WORDS = new Set([
      ...eng,
      "patient",
      "patients",
      "condition",
      "conditions",
      "medication",
      "medications",
      "allergy",
      "allergies",
      "observation",
      "observations",
      "vitals",
      "records",
  ]);