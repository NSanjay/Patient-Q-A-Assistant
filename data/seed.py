import csv, json, psycopg2, re
from datetime import datetime
import os

conn = psycopg2.connect(
    dbname=os.environ.get('DB_NAME', 'patientqa'),
    user=os.environ.get('DB_USER', 'admin'),
    password=os.environ.get('DB_PASSWORD', 'secret'),
    host=os.environ.get('DB_HOST', 'localhost'),
    port=os.environ.get('DB_PORT', '5432'),
)
cur = conn.cursor()

def clean_ts(val):
    if not val or not val.strip(): return None
    val = val.strip()

    # Remove timezone offset like "-0800" or "-0700"
    val = re.sub(r'\s*-\d{4}$', '', val)
    val = re.sub(r'\s*\+\d{4}$', '', val)
    try:
      return datetime.strptime(val, '%Y-%m-%d %H:%M:%S.%f')
    except:
      try:
        return datetime.strptime(val, '%Y-%m-%d %H:%M:%S')
      except:
        return None

def clean_date(val):
    if not val or not val.strip():
        return None
    try:
        return datetime.strptime(val.strip(), '%Y-%m-%d').date()
    except:
        return None

def clean_bool(val):
    if not val or not val.strip():
        return None
    return val.strip().upper() == 'TRUE'

def clean_json(val):
    if not val or not val.strip(): return None
    try:
        return json.loads(val)
    except:
        return None

def clean_uuid(val):
    if not val or not val.strip():
        return None
    return val.strip()

print('Seeding patients...')
with open('/Users/sanjay/Projects/Patient-Q-A-Assistant/data/patient.csv') as f:
    for r in csv.DictReader(f):
        try:
            cur.execute("""
                INSERT INTO patient VALUES (
                    %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
                ) ON CONFLICT (id) DO NOTHING
            """, (
                r['id'], r['name_first'], r['name_last'],
                clean_date(r['dob']), r['gender'], r['ethnicity_description'],
                json.dumps(clean_json(r['legal_mailing_address'])),
                r['unit_description'], r['floor_description'],
                r['room_description'], r['bed_description'],
                r['status'],
                clean_ts(r['admission_time']), clean_ts(r['discharge_time']),
                clean_ts(r['death_time']),
                r['email'], r['phone'],
                clean_bool(r['outpatient']), r['rev_by'],
                clean_ts(r['rev_time']),
                clean_bool(r['on_leave']), r['group']
            ))
        except Exception as e:
            print(f'  Patient error {r["id"]}: {e}')
            
conn.commit()
print('  Done.')

print('Seeding allergies...')
with open('/Users/sanjay/Projects/Patient-Q-A-Assistant/data/patient_allergy.csv') as f:
    for r in csv.DictReader(f):
        try:
            cur.execute("""
                INSERT INTO patient_allergy VALUES (
                    %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
                ) ON CONFLICT (id) DO NOTHING
            """, (
                r['id'], r['patient_id'], r['allergen'], r['category'],
                r['clinical_status'], r['created_by'], clean_ts(r['created_time']),
                clean_date(r['onset_date']), r['reaction_note'], r['reaction_type'],
                r['reaction_sub_type'], clean_date(r['resolved_date']),
                r['rev_by'], clean_ts(r['rev_time']), r['severity'], r['type']
            ))
        except Exception as e:
            print(f'  Allergy error {r["id"]}: {e}')
conn.commit()
print('  Done.')

print('Seeding conditions...')
with open('/Users/sanjay/Projects/Patient-Q-A-Assistant/data/patient_condition.csv') as f:
    for r in csv.DictReader(f):
        try:
            cur.execute("""
                INSERT INTO patient_condition VALUES (
                    %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
                ) ON CONFLICT (id) DO NOTHING
            """, (
                r['id'], r['patient_id'], r['clinical_status'],
                r['created_by'], clean_ts(r['created_time']),
                r['icd_10_code'], r['icd_10_description'],
                clean_date(r['onset_date']), clean_bool(r['is_primary_diagnosis']),
                clean_date(r['resolved_date']), r['rev_by'], clean_ts(r['rev_time'])
            ))
        except Exception as e:
            print(f'  Condition error {r["id"]}: {e}')
conn.commit()
print('  Done.')

print('Seeding medications...')
with open('/Users/sanjay/Projects/Patient-Q-A-Assistant/data/patient_medication.csv') as f:
    for r in csv.DictReader(f):
        try:
            cur.execute("""
                INSERT INTO patient_medication VALUES (
                    %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
                ) ON CONFLICT (id) DO NOTHING
            """, (
                r['id'], r['patient_id'], clean_ts(r['created_time']),
                r['description'], r['directions'], r['generic_name'],
                clean_bool(r['narcotic']), clean_ts(r['order_time']),
                clean_ts(r['rev_time']), r['rx_norm_id'],
                clean_date(r['start_time']), r['status'],
                r['strength'], r['strength_unit']
            ))
        except Exception as e:
            print(f'  Medication error {r["id"]}: {e}')
conn.commit()
print('  Done.')

print('Seeding observations...')
with open('/Users/sanjay/Projects/Patient-Q-A-Assistant/data/patient_observation.csv') as f:
    for r in csv.DictReader(f):
        try:
            cur.execute("""
                INSERT INTO patient_observation VALUES (
                    %s,%s,%s,%s,%s,%s
                ) ON CONFLICT (id) DO NOTHING
            """, (
                r['id'], r['patient_id'], r['method'],
                r['recorded_by'], clean_ts(r['recorded_time']),
                json.dumps(clean_json(r['data']))
            ))
        except Exception as e:
            print(f'  Observation error {r["id"]}: {e}')
conn.commit()
print('  Done.')

cur.close()
conn.close()
print('\nAll done! Database seeded successfully.')
