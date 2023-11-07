# CVDPrediction
This repository is created for sharing the code and knowledge in building CVD (Cardiovascular Disease) risk prediction for CML (Chronic myelogenous leukemia) patients, requesting and using MIMIC data, and building a digital consent tool based on our previous work - Citizen-centric personal data platform (TIDAL).
This work is a part of [CMyGuideline Project](https://www.cmylife.nl/projecten/cmyguideline) and done by the Institute of Data Science and Maastro Clinical Data Science Group and collaborating with Radboud University and Radboud UMC+.

### Background 
Chronic Myeloid Leukemia (CML) is a clonal myeloproliferative disorder of the hematopoietic system, caused by the constitutively active BCR-ABL tyrosine kinase from the translocation that produces the Philadelphia chromosome.  Patients usually are treated with different Tyrosine Kinase Inhibitor (TKI) in their chronic phases for several years. During the treatment, cardiovascular disease risk (CVD) is one of the most important factors for doctors and patients to consider when making the optimal treatment plan for patients.

### Approach 
1) **CVD Predictive Model**: We plan to build models in 3 steps by adding the possible risk factors. <img width="360" align="right" alt="image" src="https://github.com/MaastrichtU-IDS/CVDPrediction/assets/14842507/ef4478c0-db48-49ed-934c-90099b353e5f">We start with the model by only looking at the general population. Then, we add factors for CML patients and see if they have higher/lower CVD risks compared to the general population. Lastly, we add treatment factors to see how the TKI or other treatments affect the CVD risks in CML patients. We requested and used [MIMIC Clinical Database](https://physionet.org/content/mimiciii/1.4/) as starting point and then accessed to real-world patient data from Radbound UMC+.
2) **Digital Informed consent**: Patients’ health data including their examination data, daily health status, medication and treatment data are significantly valuable for the doctor making better decisions (primary use) and for further health research (secondary use). However, using and processing these data requires a lawful basis such as informed consent from patients. Every use or purpose of processing the data requires a new consent explicitly indicating the use period, controller, purpose, and many other elements required by Law. To mitigate the burden for researchers to ask for informed consent from patients and the burden of giving/withdrawing consent for patient, this task is to design and implement a digital dynamic informed consent where patient can give access of their data on a fine-grained level (data element level). We design a digital dynamic consent that can be connected with patients data, can customize the purpose, period, and process of the data use, as well as comply with GDPR and other Data Privacy Law.
<p align="center">
  <img width="420" height="280" src="https://github.com/MaastrichtU-IDS/CVDPrediction/assets/14842507/6f19bea6-395f-4d4f-9428-a7a6606b6d0a">
</p>

### Content in this repo
#### 1) Request data access to MIMIC Clinical Database
MIMIC-III/IV is a large, freely-available database comprising de-identified health-related data associated with over 40K patients who stayed in critical care units of the Beth Israel Deaconess Medical Center between 2001 and 2012. The database includes information such as demographics, vital sign measurements made at the bedside, laboratory test results, procedures, medications, caregiver notes, imaging reports, and mortality.

To gain access to this data, you will need to ([Data access link](https://physionet.org/content/mimiciii/1.4/))
1. Create an account (1-3 minutes)
2. Get CITI Data or Specimens Only Research training (8-9 hours)
    - Some colleagues indicate they cannot get free training from the website. Please check the solution here: https://github.com/MIT-LCP/mimic-code/issues/440 
4. Passed the training test (1-2 hours)
5. Sign the user agreement (5 minutes)

If you want to explore what data are in MIMIC database without going through the whole process, we suggest you try [MIMIC-Demo](https://physionet.org/content/mimiciii-demo/1.4/D_LABITEMS.csv) and you can explore the variables in each data file for example: https://physionet.org/content/mimiciii-demo/1.4/D_LABITEMS.csv

#### 2) Query and use MIMIC data
Once you finish the training and obtain the data access, you can download all the data files to your local computer (7-8G) or use Google BigQuery to extract the data you need. We recommend the second option which is relatively easy and efficient. 

In our use case, we need to extract demographic data, lab test data (using SNOMED CT code), and medication data from patients with Leukemia (using ICD 9 Code 205.XX). We provided our [query files](https://github.com/MaastrichtU-IDS/CVDPrediction/blob/main/mimicQuery.sql) in this repo. You can modify it based on your own use case. 

#### 3) Build ML predictive models
#### 4) Deploy the model as a web application
The prototype of the decision aid tool can be accessed via http://cvd-predictor.137.120.31.148.nip.io/ 
The tool requires doctors to give patient's demongraphic and health data, lab tests data, and TKI data. 
#### 5) Digital Consent Tool


