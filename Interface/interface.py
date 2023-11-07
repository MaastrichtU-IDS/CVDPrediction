from flask import Flask, request, render_template
import pandas as pd
import shap
import joblib

app = Flask(__name__)

# Dummy machine learning model (replace this with your actual model)
def cvd_predictor(input_df_data, model):
    if model == "LR":
        model_file = "models/model_LR.pkl"
    elif model == "SVM":
        model_file = "models/model_SVM.pkl"
    elif model == "XGB":
        model_file = "models/model_XGB.pkl"
    elif model == "LR_explainer":
        model_file = "models/LR_explainer.bz2"
    elif model == "SVM_explainer":
        model_file = "models/SVM_explainer.bz2"
    elif model == "XGB_explainer":
        model_file = "models/XGB_explainer.bz2"

    loaded_model = joblib.load(filename=model_file)

    if model == "LR" or model =="SVM" or model == "XGB":
        predicted_value = "{:.2f}".format(loaded_model.predict_proba(input_df_data)[0][1] * 100)

    elif model == "LR_explainer" or model =="SVM_explainer":
        shap_values = loaded_model.shap_values(input_df_data)
        def _force_plot_html(explainer, shap_values):            
            force_plot = shap.force_plot(explainer.expected_value[1], shap_values[1], input_df_data,  matplotlib=False)
            shap_html = f"<head>{shap.getjs()}</head><body>{force_plot.html()}</body>"
            return shap_html
        
        shap_plots = {}
        for i in range(1): #how many plots you want
            shap_plots[i] = _force_plot_html(loaded_model, shap_values)
        predicted_value = shap_plots

    elif model == "XGB_explainer":
        shap_values = loaded_model.shap_values(input_df_data)
        def _force_plot_html(explainer, shap_values):            
            force_plot = shap.force_plot(explainer.expected_value, shap_values[0, :],input_df_data.iloc[0,:])
            shap_html = f"<head>{shap.getjs()}</head><body>{force_plot.html()}</body>"
            return shap_html

        shap_plots = {}
        for i in range(1): #how many plots you want
            shap_plots[i] = _force_plot_html(loaded_model, shap_values)

        predicted_value = shap_plots

    return predicted_value


@app.route('/', methods=['GET', 'POST'])

def home():
    predicted_risk = None
    
    anchor_age = None
    bmi = None

    diastolic = None
    systolic = None
    gender = None
    diabetes = None
    kidney = None
    Red_Blood_Cells = None
    Urea_Nitrogen = None
    Albumin = None
    Lactate_Dehydrogenase = None
    Metamyelocytes = None
    Cholesterol_Total = None
    Hemoglobin_A1c = None
    Glucose = None
    drug = None
    dose = None
    model = None
    
    if request.method == 'POST':

        anchor_age = float(request.form['anchor_age'])
        bmi = float(request.form['bmi'])

        diastolic = float(request.form['diastolic'])
        systolic = float(request.form['systolic'])
        gender = float(request.form['gender'])
        diabetes = float(request.form['diabetes'])
        kidney = float(request.form['kidney'])
        Red_Blood_Cells = float(request.form['Red_Blood_Cells'])
        Urea_Nitrogen = float(request.form['Urea_Nitrogen'])
        Albumin = float(request.form['Albumin'])
        Lactate_Dehydrogenase = float(request.form['Lactate_Dehydrogenase'])
        Metamyelocytes = float(request.form['Metamyelocytes'])
        Cholesterol_Total = float(request.form['Cholesterol_Total'])
        Hemoglobin_A1c = float(request.form['Hemoglobin_A1c'])
        Glucose = float(request.form['Glucose'])
        drug = request.form['drug']
        dose = float(request.form['dose'])

        variable_col = ['gender', 'BMI', 'anchor_age', 'diastolic', 'systolic', 'diabetes', 'kidney', 
                        'Red Blood Cells','Urea Nitrogen', 'Albumin', 'Lactate Dehydrogenase (LD)',
                        'Metamyelocytes', 'Cholesterol, Total', '% Hemoglobin A1c', 'Glucose',
                        'drug_Dasatinib', 'drug_Imatinib', 'drug_Nilotinib']
        
        drug_Dasatinib = 0
        drug_Imatinib = 0
        drug_Nilotinib = 0
        
        if drug == "Dasatinib":
            drug_Dasatinib = dose
        elif drug == "Imatinib":
            drug_Imatinib = dose
        elif drug == "Nilotinib":
            drug_Nilotinib = dose
        
        variable_list = [gender, bmi, anchor_age, diastolic, systolic, diabetes, kidney,
                         Red_Blood_Cells, Urea_Nitrogen, Albumin, Lactate_Dehydrogenase,
                         Metamyelocytes, Cholesterol_Total, Hemoglobin_A1c, Glucose,
                         drug_Dasatinib, drug_Imatinib, drug_Nilotinib]
        
        input_df_data = pd.DataFrame(variable_list, index=variable_col).transpose().iloc[0:1]
        
        # Call your machine learning model to make a prediction
        model = request.form['model']

        predicted_risk = cvd_predictor(input_df_data, model)

    return render_template('cmlCvdPredictor.html',
                            anchor_age=anchor_age, 
                            bmi=bmi, 
                            diastolic=diastolic,
                            systolic=systolic,
                            gender=gender,
                            diabetes=diabetes,
                            kidney=kidney,
                            Red_Blood_Cells=Red_Blood_Cells,
                            Urea_Nitrogen=Urea_Nitrogen,
                            Albumin=Albumin,
                            Lactate_Dehydrogenase=Lactate_Dehydrogenase,
                            Metamyelocytes=Metamyelocytes,
                            Cholesterol_Total=Cholesterol_Total,
                            Hemoglobin_A1c=Hemoglobin_A1c,
                            drug=drug,
                            dose=dose,
                            Glucose=Glucose,
                            model=model,
                            predicted_risk=predicted_risk)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)

