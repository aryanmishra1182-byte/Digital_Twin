import pytest
from fastapi.testclient import TestClient
from ml.service import app
from ml.csv_analyzer import generate_csv_template, validate_and_parse_csv

client = TestClient(app)

def test_ai4i_benchmark_endpoint():
    res = client.get("/ai4i/benchmark")
    assert res.status_code == 200
    data = res.json()
    assert data["dataset_name"] == "UCI AI4I 2020 Predictive Maintenance Dataset"
    assert data["total_instances"] == 10000
    assert "XGBoost Classifier" in data["model_comparison"]

def test_ai4i_predict_endpoint():
    payload = {
        "air_temp_k": 298.1,
        "process_temp_k": 308.6,
        "rotational_speed_rpm": 1551.0,
        "torque_nm": 42.8,
        "tool_wear_min": 0.0,
        "machine_type": "M"
    }
    res = client.post("/ai4i/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "is_failure_predicted" in data
    assert "failure_probability" in data
    assert "risk_level" in data
    assert len(data["top_shap_attributions"]) > 0

def test_csv_template_generator():
    ai4i_csv = generate_csv_template("ai4i")
    assert "Air_temperature_K" in ai4i_csv
    assert "Type" in ai4i_csv

    motor_csv = generate_csv_template("motor")
    assert "current_rms" in motor_csv
    assert "vib_bpfo_energy" in motor_csv

def test_csv_field_guide_endpoint():
    res = client.get("/csv/field-guide/ai4i")
    assert res.status_code == 200
    data = res.json()
    assert len(data["fields"]) == 6

    res_motor = client.get("/csv/field-guide/motor")
    assert res_motor.status_code == 200
    data_motor = res_motor.json()
    assert len(data_motor["fields"]) == 26

def test_csv_batch_analyze_ai4i():
    sample_csv = "Air_temperature_K,Process_temperature_K,Rotational_speed_rpm,Torque_Nm,Tool_wear_min,Type\n298.1,308.6,1551,42.8,0,M\n298.2,308.7,1408,46.3,3,L"
    res = client.post("/csv/analyze/ai4i", json={"csv_text": sample_csv})
    assert res.status_code == 200
    data = res.json()
    assert data["valid_rows_count"] == 2
    assert len(data["analysis_results"]) == 2
    assert "export_csv_content" in data
