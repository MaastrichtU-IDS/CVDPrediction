-- Step 1: Find patients with Leukemia (with ICD-9 205.XX)
SELECT DISTINCT subject_id FROM `physionet-data.mimiciv_hosp.diagnoses_icd` WHERE icd_code  LIKE '205%';

-- Step 2: Query patient age, gender, bmi, weight, height, blood pressure
SELECT DISTINCT diag_table.subject_id, diag_table.icd_code, patients_table.gender, patients_table.anchor_age, omr_table.result_name, omr_table.result_value

FROM `physionet-data.mimiciv_hosp.diagnoses_icd`  AS diag_table

JOIN `physionet-data.mimiciv_hosp.patients`  AS patients_table ON diag_table.subject_id = patients_table.subject_id

JOIN `physionet-data.mimiciv_hosp.omr`  AS omr_table ON diag_table.subject_id = omr_table.subject_id

WHERE diag_table.icd_code LIKE '205%';

-- Step 3: Extract all the lab tests results
SELECT DISTINCT diag_table.subject_id, diag_table.hadm_id, diag_table.icd_code, labevent_table.itemid, items_table.label, labevent_table.value, labevent_table.valuenum, labevent_table.valueuom, labevent_table.flag, labevent_table.priority, labevent_table.comments

FROM `physionet-data.mimiciv_hosp.diagnoses_icd`  AS diag_table

JOIN `physionet-data.mimiciv_hosp.labevents`  AS labevent_table ON diag_table.subject_id = labevent_table.subject_id

JOIN `physionet-data.mimiciv_hosp.d_labitems`  AS items_table ON labevent_table.itemid = items_table.itemid

WHERE diag_table.icd_code LIKE '205%' AND labevent_table.itemid IN (50809, 50903,50904,50905, 50906,50907, 50809, 50889,50963,51278,51279, 50806, 50811, 50814);


-- Step 4: Extract all medication data of these patients
SELECT DISTINCT diag_table.subject_id, diag_table.icd_code, pres_table.drug, pres_table.doses_per_24_hrs

FROM `physionet-data.mimiciv_hosp.diagnoses_icd`  AS diag_table

JOIN `physionet-data.mimiciv_hosp.prescriptions`  AS pres_table ON diag_table.subject_id = pres_table.subject_id

WHERE diag_table.icd_code LIKE '205%' 

  
  -- Step 5: Extract all diagnoses from patients
SELECT DISTINCT diag_table.subject_id, diag2_table.icd_code

FROM `physionet-data.mimiciv_hosp.diagnoses_icd`  AS diag_table

JOIN `physionet-data.mimiciv_hosp.patients`  AS patients_table ON diag_table.subject_id = patients_table.subject_id

JOIN `physionet-data.mimiciv_hosp.diagnoses_icd`  AS diag2_table ON diag_table.subject_id = diag2_table.subject_id

WHERE diag_table.icd_code LIKE '205%';

