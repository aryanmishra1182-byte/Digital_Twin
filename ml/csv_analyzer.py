"""
MACHINA-X Offline CSV Sensor Data Analysis Module
=================================================
Provides schema validation, field guides, template generation,
batch model inference, and results CSV export for:
Mode 1: UCI AI4I 2020 Benchmark Inference
Mode 2: Motor Sensor-Feature (26 MCSA/Vib/Thermal) Inference
"""

import io
import csv
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional
from ml.features.feature_extractor import FEATURE_NAMES
from simulator.motor_simulator import FAULT_CLASSES

AI4I_INPUT_COLUMNS = [
    "Air_temperature_K",
    "Process_temperature_K",
    "Rotational_speed_rpm",
    "Torque_Nm",
    "Tool_wear_min",
    "Type"
]

AI4I_FIELD_GUIDE = [
    {
        "column": "Air_temperature_K",
        "description": "Ambient factory air temperature surrounding the equipment",
        "unit": "Kelvin (K)",
        "type": "float",
        "required": True,
        "valid_range": "290.0 - 310.0 K (approx 17°C - 37°C)",
        "example": 298.1
    },
    {
        "column": "Process_temperature_K",
        "description": "Temperature generated at the workpiece/machine process interface",
        "unit": "Kelvin (K)",
        "type": "float",
        "required": True,
        "valid_range": "300.0 - 320.0 K",
        "example": 308.6
    },
    {
        "column": "Rotational_speed_rpm",
        "description": "Spindle rotational speed measured by shaft tachometer",
        "unit": "Revolutions Per Minute (RPM)",
        "type": "float",
        "required": True,
        "valid_range": "1000.0 - 3000.0 RPM",
        "example": 1551.0
    },
    {
        "column": "Torque_Nm",
        "description": "Spindle mechanical shaft torque",
        "unit": "Newton-meters (Nm)",
        "type": "float",
        "required": True,
        "valid_range": "3.0 - 90.0 Nm",
        "example": 42.8
    },
    {
        "column": "Tool_wear_min",
        "description": "Accumulated cutting tool operational wear duration",
        "unit": "Minutes",
        "type": "float",
        "required": True,
        "valid_range": "0.0 - 300.0 min",
        "example": 142.0
    },
    {
        "column": "Type",
        "description": "Product quality variant (L: Low/50%, M: Medium/30%, H: High/20%)",
        "unit": "Categorical code",
        "type": "string ('L', 'M', or 'H')",
        "required": True,
        "valid_range": "L, M, H",
        "example": "M"
    }
]

MOTOR_FIELD_GUIDE = [
    {
        "column": name,
        "description": f"Domain-extracted feature: {name.replace('_', ' ')}",
        "unit": "A RMS" if "current" in name else ("mm/s" if "vib" in name else ("°C" if "temp" in name else "Ratio/Index")),
        "type": "float",
        "required": True,
        "valid_range": "Physically bounded (non-negative)",
        "example": 5.8 if "current_rms" in name else (0.25 if "vib" in name else (42.0 if "temp" in name else 1.0))
    }
    for name in FEATURE_NAMES
]

def generate_csv_template(mode: str) -> str:
    """Generate empty CSV template with exact authoritative headers (no fabricated values)."""
    output = io.StringIO()
    writer = csv.writer(output)
    if mode.lower() == "ai4i":
        writer.writerow(AI4I_INPUT_COLUMNS)
    elif mode.lower() == "motor":
        writer.writerow(FEATURE_NAMES)
    else:
        raise ValueError(f"Unknown mode '{mode}'. Choose 'ai4i' or 'motor'.")
    return output.getvalue()

def validate_and_parse_csv(csv_content: str, mode: str) -> Tuple[List[Dict[str, Any]], List[str]]:
    """Parse CSV text, enforce headers, data types, and non-empty rows. Returns (valid_rows, error_messages)."""
    valid_rows = []
    errors = []
    
    stream = io.StringIO(csv_content.strip())
    reader = csv.DictReader(stream)
    
    if not reader.fieldnames:
        return [], ["CSV file is empty or could not parse column headers."]
        
    expected_cols = AI4I_INPUT_COLUMNS if mode.lower() == "ai4i" else FEATURE_NAMES
    missing_cols = [c for c in expected_cols if c not in reader.fieldnames]
    if missing_cols:
        return [], [f"Missing required column headers: {', '.join(missing_cols[:5])} (Total missing: {len(missing_cols)})"]
        
    for row_idx, row in enumerate(reader, start=2):  # row 2 is first data row
        row_errors = []
        cleaned_row = {}
        
        if mode.lower() == "ai4i":
            for col in ["Air_temperature_K", "Process_temperature_K", "Rotational_speed_rpm", "Torque_Nm", "Tool_wear_min"]:
                val_str = row.get(col, "").strip()
                if not val_str:
                    row_errors.append(f"Row {row_idx}: Missing value for '{col}'")
                else:
                    try:
                        v = float(val_str)
                        if v < 0:
                            row_errors.append(f"Row {row_idx}: '{col}' cannot be negative ({v})")
                        cleaned_row[col] = v
                    except ValueError:
                        row_errors.append(f"Row {row_idx}: '{col}' must be a numerical float, got '{val_str}'")
                        
            type_val = row.get("Type", "").strip().upper()
            if type_val not in ["L", "M", "H"]:
                row_errors.append(f"Row {row_idx}: 'Type' must be one of 'L', 'M', or 'H', got '{type_val}'")
            else:
                cleaned_row["Type"] = type_val
                
        elif mode.lower() == "motor":
            for col in FEATURE_NAMES:
                val_str = row.get(col, "").strip()
                if not val_str:
                    row_errors.append(f"Row {row_idx}: Missing value for '{col}'")
                else:
                    try:
                        cleaned_row[col] = float(val_str)
                    except ValueError:
                        row_errors.append(f"Row {row_idx}: '{col}' must be a float, got '{val_str}'")
                        
        if row_errors:
            errors.extend(row_errors)
        else:
            cleaned_row["_row_number"] = row_idx
            valid_rows.append(cleaned_row)
            
    return valid_rows, errors

def analyze_ai4i_batch(valid_rows: List[Dict[str, Any]], model, explainer, feature_names: List[str]) -> Tuple[List[Dict[str, Any]], str]:
    """Execute batch inference and SHAP explainability on AI4I records."""
    if not valid_rows:
        return [], ""
        
    results = []
    # Build DataFrame
    processed_dicts = []
    for r in valid_rows:
        temp_diff = r["Process_temperature_K"] - r["Air_temperature_K"]
        power_w = r["Torque_Nm"] * (r["Rotational_speed_rpm"] * 2 * np.pi / 60)
        overstrain = r["Tool_wear_min"] * r["Torque_Nm"]
        type_code = {"L": 0, "M": 1, "H": 2}.get(r["Type"], 1)
        
        row_dict = {
            "Air_temperature_K": r["Air_temperature_K"],
            "Process_temperature_K": r["Process_temperature_K"],
            "Rotational_speed_rpm": r["Rotational_speed_rpm"],
            "Torque_Nm": r["Torque_Nm"],
            "Tool_wear_min": r["Tool_wear_min"],
            "Temp_difference_K": temp_diff,
            "Mechanical_Power_W": power_w,
            "Overstrain_Metric": overstrain,
            "Type_Code": type_code
        }
        processed_dicts.append(row_dict)
        
    df_features = pd.DataFrame(processed_dicts)[feature_names]
    probs = model.predict_proba(df_features)[:, 1]
    
    # Compute SHAP if explainer available
    shap_matrix = explainer.shap_values(df_features) if explainer else None
    
    for idx, r in enumerate(valid_rows):
        p = float(probs[idx])
        is_fail = bool(p >= 0.5)
        risk = "CRITICAL" if p >= 0.70 else ("ELEVATED" if p >= 0.35 else "LOW")
        
        top_shap = []
        top_driver = "Nominal Dynamics"
        if shap_matrix is not None:
            local_s = shap_matrix[idx]
            for f, s in zip(feature_names, local_s):
                top_shap.append({
                    "feature": f,
                    "value": round(float(df_features.iloc[idx][f]), 2),
                    "shap_value": round(float(s), 4),
                    "direction": "INCREASES_RISK" if s > 0 else "DECREASES_RISK"
                })
            top_shap = sorted(top_shap, key=lambda a: abs(a["shap_value"]), reverse=True)
            if top_shap:
                top_driver = f"{top_shap[0]['feature']} ({'+' if top_shap[0]['shap_value'] > 0 else ''}{top_shap[0]['shap_value']})"
                
        rec = "Normal operating baseline. Continue routine maintenance."
        if is_fail:
            if r["Tool_wear_min"] * r["Torque_Nm"] > 11000:
                rec = "Overstrain Failure (OSF) Risk. Reduce torque load and check tool wear limit immediately."
            elif (r["Process_temperature_K"] - r["Air_temperature_K"]) < 8.6 and r["Rotational_speed_rpm"] < 1380:
                rec = "Heat Dissipation Failure (HDF) Risk. Verify cooling airflow and clean heat dissipation surfaces."
            elif (r["Torque_Nm"] * r["Rotational_speed_rpm"] * 2 * np.pi / 60) < 3500 or (r["Torque_Nm"] * r["Rotational_speed_rpm"] * 2 * np.pi / 60) > 9000:
                rec = "Power Failure (PWF) Risk. Inspect line voltage and drive inverter stability."
            elif r["Tool_wear_min"] > 200:
                rec = "Tool Wear Failure (TWF) Risk. Replace cutting tool insert."
            else:
                rec = "Machine Failure Risk. Plan proactive inspection before next operating shift."
                
        item = {
            "row_number": r["_row_number"],
            "inputs": {k: r[k] for k in AI4I_INPUT_COLUMNS},
            "is_failure_predicted": is_fail,
            "failure_probability": round(p, 4),
            "risk_level": risk,
            "top_driver": top_driver,
            "recommendation": rec,
            "top_shap_attributions": top_shap[:5] if top_shap else []
        }
        results.append(item)
        
    # Generate Downloadable Export CSV
    export_output = io.StringIO()
    export_writer = csv.writer(export_output)
    export_headers = AI4I_INPUT_COLUMNS + ["Predicted_Condition", "Failure_Probability", "Risk_Level", "Top_SHAP_Driver", "Recommended_Action"]
    export_writer.writerow(export_headers)
    for res in results:
        inp = res["inputs"]
        export_writer.writerow([
            inp["Air_temperature_K"],
            inp["Process_temperature_K"],
            inp["Rotational_speed_rpm"],
            inp["Torque_Nm"],
            inp["Tool_wear_min"],
            inp["Type"],
            "FAILURE" if res["is_failure_predicted"] else "HEALTHY",
            f"{res['failure_probability']*100:.2f}%",
            res["risk_level"],
            res["top_driver"],
            res["recommendation"]
        ])
        
    return results, export_output.getvalue()

def analyze_motor_batch(valid_rows: List[Dict[str, Any]], anomaly_bundle, classifier_bundle, shap_explainer) -> Tuple[List[Dict[str, Any]], str]:
    """Execute batch inference on 26 motor features using Isolation Forest + XGBoost Multiclass."""
    if not valid_rows:
        return [], ""
        
    results = []
    raw_records = [{k: r[k] for k in FEATURE_NAMES} for r in valid_rows]
    df_features = pd.DataFrame(raw_records)[FEATURE_NAMES]
    
    # Anomaly detector
    iso_model = anomaly_bundle["model"]
    iso_scaler = anomaly_bundle["scaler"]
    scaled_feats = iso_scaler.transform(df_features.values)
    raw_scores = iso_model.decision_function(scaled_feats)
    # Convert decision_function to 0..1 anomaly score (negative values are outliers)
    anomaly_scores = 1.0 / (1.0 + np.exp(raw_scores))
    is_anomalies = iso_model.predict(scaled_feats) == -1
    
    # Fault classifier
    xgb_model = classifier_bundle["model"]
    class_to_idx = classifier_bundle["class_to_idx"]
    idx_to_class = classifier_bundle["idx_to_class"]
    
    probs = xgb_model.predict_proba(df_features.values)
    preds = np.argmax(probs, axis=1)
    
    for idx, r in enumerate(valid_rows):
        pred_idx = int(preds[idx])
        pred_class = idx_to_class.get(pred_idx, FAULT_CLASSES[pred_idx] if pred_idx < len(FAULT_CLASSES) else "UNKNOWN")
        conf = float(probs[idx, pred_idx])
        iso_score = float(anomaly_scores[idx])
        is_anom = bool(is_anomalies[idx])
        
        # Risk assessment
        risk = "HEALTHY" if pred_class == "HEALTHY" and not is_anom else ("CRITICAL" if pred_class in ["BROKEN_ROTOR_BAR", "STATOR_INTER_TURN_SHORT"] else "WARNING")
        
        # Top SHAP attributions
        top_shap = []
        top_driver = "Nominal MCSA Balance"
        if shap_explainer and hasattr(shap_explainer, "explainer"):
            try:
                local_vals = shap_explainer.explainer.shap_values(df_features.iloc[[idx]].values)[0]
                for f_name, s_val in zip(FEATURE_NAMES, local_vals):
                    top_shap.append({
                        "feature": f_name,
                        "value": round(float(df_features.iloc[idx][f_name]), 4),
                        "shap_value": round(float(s_val), 4),
                        "direction": "INCREASES_RISK" if s_val > 0 else "DECREASES_RISK"
                    })
                top_shap = sorted(top_shap, key=lambda a: abs(a["shap_value"]), reverse=True)
                if top_shap:
                    top_driver = f"{top_shap[0]['feature']} ({'+' if top_shap[0]['shap_value'] > 0 else ''}{top_shap[0]['shap_value']})"
            except Exception as e:
                pass
                
        rec = "Operational within nominal vibration and current tolerances."
        if pred_class == "BROKEN_ROTOR_BAR":
            rec = "Inspect rotor cage end rings and bar joints (MCSA sideband excitation)."
        elif pred_class == "STATOR_INTER_TURN_SHORT":
            rec = "Measure turn-to-turn insulation resistance (IEEE 522 surge test)."
        elif pred_class == "BEARING_DEFECT":
            rec = "Check bearing lubrication grease and schedule replacement (BPFO shock impacts)."
        elif pred_class == "AIR_GAP_ECCENTRICITY":
            rec = "Inspect bearing housing shims and rotor shaft concentricity."
            
        item = {
            "row_number": r["_row_number"],
            "inputs": {k: r[k] for k in FEATURE_NAMES},
            "is_anomaly": is_anom,
            "anomaly_score": round(iso_score, 4),
            "predicted_fault_class": pred_class,
            "confidence": round(conf, 4),
            "risk_level": risk,
            "top_driver": top_driver,
            "recommendation": rec,
            "top_shap_attributions": top_shap[:5] if top_shap else []
        }
        results.append(item)
        
    # Generate Downloadable Export CSV
    export_output = io.StringIO()
    export_writer = csv.writer(export_output)
    export_headers = FEATURE_NAMES + ["Stage1_Anomaly", "Anomaly_Score", "Stage2_Predicted_Fault", "Confidence", "Risk_Level", "Top_SHAP_Driver", "Recommended_Action"]
    export_writer.writerow(export_headers)
    for res in results:
        inp = res["inputs"]
        row_vals = [inp[k] for k in FEATURE_NAMES]
        row_vals.extend([
            "ANOMALY" if res["is_anomaly"] else "NORMAL",
            f"{res['anomaly_score']:.4f}",
            res["predicted_fault_class"],
            f"{res['confidence']*100:.2f}%",
            res["risk_level"],
            res["top_driver"],
            res["recommendation"]
        ])
        export_writer.writerow(row_vals)
        
    return results, export_output.getvalue()
