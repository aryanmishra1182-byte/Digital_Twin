"""
Train and benchmark reproducible predictive maintenance models on the official UCI AI4I 2020 Dataset.
Evaluates Logistic Regression, Decision Tree, Random Forest, and XGBoost with real metrics and SHAP explainability.
"""

import json
import os
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)
import xgboost as xgb
import shap
import shap.explainers._tree as st

# Apply compatibility patch for XGBoost 3.x array-string base_score with SHAP
_orig_loader_init = st.XGBTreeModelLoader.__init__

def _patched_xgbtree_loader_init(self, xgb_model):
    old_decode = st.decode_ubjson_buffer
    def safe_decode(fd):
        res = old_decode(fd)
        if "learner" in res and "learner_model_param" in res["learner"]:
            bs = res["learner"]["learner_model_param"].get("base_score")
            if isinstance(bs, str) and bs.startswith("["):
                first_val = bs.strip("[]").split(",")[0].strip()
                res["learner"]["learner_model_param"]["base_score"] = first_val
        return res
    st.decode_ubjson_buffer = safe_decode
    try:
        _orig_loader_init(self, xgb_model)
    finally:
        st.decode_ubjson_buffer = old_decode

st.XGBTreeModelLoader.__init__ = _patched_xgbtree_loader_init

def load_and_preprocess(csv_path="data/ai4i2020/ai4i2020.csv"):
    df = pd.read_csv(csv_path)
    
    # Feature engineering based on domain physics
    df["Temp_difference_K"] = df["Process temperature [K]"] - df["Air temperature [K]"]
    df["Mechanical_Power_W"] = df["Torque [Nm]"] * (df["Rotational speed [rpm]"] * 2 * np.pi / 60)
    df["Overstrain_Metric"] = df["Tool wear [min]"] * df["Torque [Nm]"]
    
    # Map Type to ordinal quality weight (L: 0, M: 1, H: 2)
    type_map = {"L": 0, "M": 1, "H": 2}
    df["Type_Code"] = df["Type"].map(type_map)
    
    feature_cols = [
        "Air temperature [K]",
        "Process temperature [K]",
        "Rotational speed [rpm]",
        "Torque [Nm]",
        "Tool wear [min]",
        "Temp_difference_K",
        "Mechanical_Power_W",
        "Overstrain_Metric",
        "Type_Code"
    ]
    
    clean_feature_names = [
        "Air_temperature_K",
        "Process_temperature_K",
        "Rotational_speed_rpm",
        "Torque_Nm",
        "Tool_wear_min",
        "Temp_difference_K",
        "Mechanical_Power_W",
        "Overstrain_Metric",
        "Type_Code"
    ]
    
    X = df[feature_cols].copy()
    X.columns = clean_feature_names
    y = df["Machine failure"].values
    
    return df, X, y, clean_feature_names

def train_and_evaluate():
    print("Loading UCI AI4I 2020 Dataset...")
    raw_df, X, y, feature_names = load_and_preprocess()
    
    total_samples = len(X)
    failure_samples = int(np.sum(y))
    healthy_samples = total_samples - failure_samples
    failure_rate = (failure_samples / total_samples) * 100
    
    print(f"Dataset Shape: {X.shape}, Failures: {failure_samples} ({failure_rate:.2f}%)")
    
    # Stratified 80/20 train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Define models
    models = {
        "Logistic Regression (Baseline)": LogisticRegression(class_weight="balanced", random_state=42, max_iter=1000),
        "Decision Tree (Baseline)": DecisionTreeClassifier(max_depth=6, class_weight="balanced", random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=8, class_weight="balanced", random_state=42),
        "XGBoost Classifier": xgb.XGBClassifier(
            n_estimators=120,
            max_depth=5,
            learning_rate=0.08,
            scale_pos_weight=(healthy_samples / failure_samples),
            eval_metric="logloss",
            random_state=42
        )
    }
    
    results = {}
    best_f1 = -1
    best_model_name = None
    best_model = None
    
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    for name, clf in models.items():
        print(f"\n--- Evaluating {name} ---")
        
        # Use scaled inputs for Logistic Regression, raw DataFrame for trees/XGB
        X_tr = X_train_scaled if "Logistic" in name else X_train
        X_te = X_test_scaled if "Logistic" in name else X_test
        
        # 5-fold cross validation
        cv_scores = cross_validate(
            clf, X_tr, y_train, cv=cv,
            scoring=["accuracy", "precision", "recall", "f1", "roc_auc"]
        )
        
        # Train on full train partition
        clf.fit(X_tr, y_train)
        y_pred = clf.predict(X_te)
        y_prob = clf.predict_proba(X_te)[:, 1] if hasattr(clf, "predict_proba") else y_pred
        
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1_bin = f1_score(y_test, y_pred, zero_division=0)
        f1_macro = f1_score(y_test, y_pred, average="macro", zero_division=0)
        f1_weighted = f1_score(y_test, y_pred, average="weighted", zero_division=0)
        roc = roc_auc_score(y_test, y_prob)
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        tn, fp, fn, tp = cm[0][0], cm[0][1], cm[1][0], cm[1][1]
        prec_0 = tn / (tn + fn) if (tn + fn) > 0 else 0.0
        rec_0 = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        f1_0 = 2 * prec_0 * rec_0 / (prec_0 + rec_0) if (prec_0 + rec_0) > 0 else 0.0
        
        results[name] = {
            "test_accuracy": round(float(acc), 4),
            "test_precision": round(float(prec), 4),
            "test_recall": round(float(rec), 4),
            "test_f1": round(float(f1_bin), 4),
            "test_f1_binary": round(float(f1_bin), 4),
            "test_f1_macro": round(float(f1_macro), 4),
            "test_f1_weighted": round(float(f1_weighted), 4),
            "test_roc_auc": round(float(roc), 4),
            "confusion_matrix": cm,
            "metric_semantics": "test_f1 is binary F1 on positive minority class (Machine Failure, pos_label=1). test_f1_macro is unweighted average of Healthy and Failure classes.",
            "per_class_metrics": {
                "healthy_class_0": {
                    "precision": round(float(prec_0), 4),
                    "recall": round(float(rec_0), 4),
                    "f1": round(float(f1_0), 4),
                    "support": int(tn + fp)
                },
                "failure_class_1": {
                    "precision": round(float(prec), 4),
                    "recall": round(float(rec), 4),
                    "f1": round(float(f1_bin), 4),
                    "support": int(fn + tp)
                }
            },
            "cv_f1_mean": round(float(np.mean(cv_scores["test_f1"])), 4),
            "cv_f1_std": round(float(np.std(cv_scores["test_f1"])), 4),
            "cv_roc_auc_mean": round(float(np.mean(cv_scores["test_roc_auc"])), 4)
        }
        
        print(f"Test Accuracy: {acc*100:.2f}%, Precision (Failure): {prec*100:.2f}%, Recall (Failure): {rec*100:.2f}%, Binary F1: {f1_bin:.4f}, Macro F1: {f1_macro:.4f}, ROC-AUC: {roc:.4f}")
        
        if f1_bin > best_f1:
            best_f1 = f1_bin
            best_model_name = name
            best_model = clf

    print(f"\n==========================================")
    print(f"Selected Champion Model: {best_model_name} (Test F1: {best_f1:.4f})")
    print(f"==========================================")
    
    # Compute SHAP values on test set using TreeExplainer
    print("Computing SHAP TreeExplainer attributions...")
    explainer = shap.TreeExplainer(best_model)
    shap_values = explainer.shap_values(X_test)
    
    mean_abs_shap = np.mean(np.abs(shap_values), axis=0)
    shap_ranking = sorted(
        [{"feature": f, "mean_abs_shap": round(float(s), 4)} for f, s in zip(feature_names, mean_abs_shap)],
        key=lambda x: x["mean_abs_shap"],
        reverse=True
    )
    
    # Save artifacts
    artifacts_dir = "ml/artifacts/ai4i"
    os.makedirs(artifacts_dir, exist_ok=True)
    
    joblib.dump(best_model, os.path.join(artifacts_dir, "ai4i_champion_model.joblib"))
    joblib.dump(scaler, os.path.join(artifacts_dir, "ai4i_scaler.joblib"))
    
    with open(os.path.join(artifacts_dir, "feature_names.json"), "w") as f:
        json.dump(feature_names, f, indent=2)
        
    evaluation_metadata = {
        "dataset_name": "UCI AI4I 2020 Predictive Maintenance Dataset",
        "source_url": "https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset",
        "citation": "Mathes, S. (2020). AI4I 2020 Predictive Maintenance Dataset. UCI Machine Learning Repository.",
        "license": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
        "total_instances": total_samples,
        "features_count": len(feature_names),
        "failure_count": failure_samples,
        "healthy_count": healthy_samples,
        "class_imbalance_ratio": f"{healthy_samples / failure_samples:.1f}:1",
        "champion_model": best_model_name,
        "model_comparison": results,
        "shap_global_ranking": shap_ranking
    }
    
    with open(os.path.join(artifacts_dir, "ai4i_evaluation_metrics.json"), "w") as f:
        json.dump(evaluation_metadata, f, indent=2)
        
    # Generate sample representative test cases for interactive UI exploration
    # Extract 5 true failures of different modes and 5 healthy instances
    test_cases = []
    test_indices = X_test.index
    for idx in test_indices:
        row_raw = raw_df.loc[idx]
        y_true = int(row_raw["Machine failure"])
        x_row = X.loc[[idx]]
        pred_prob = float(best_model.predict_proba(x_row)[0, 1])
        pred_class = int(pred_prob >= 0.5)
        
        # Local SHAP attribution for this instance
        local_shap = explainer.shap_values(x_row)[0]
        attributions = [
            {
                "feature": f,
                "value": round(float(x_row[f].values[0]), 2),
                "shap_value": round(float(s), 4),
                "direction": "INCREASES_FAILURE_RISK" if s > 0 else "DECREASES_RISK"
            }
            for f, s in zip(feature_names, local_shap)
        ]
        attributions = sorted(attributions, key=lambda a: abs(a["shap_value"]), reverse=True)
        
        failure_type = "Healthy"
        for mode in ["TWF", "HDF", "PWF", "OSF", "RNF"]:
            if row_raw[mode] == 1:
                failure_type = mode
                break
                
        test_cases.append({
            "udi": int(row_raw["UDI"]),
            "product_id": str(row_raw["Product ID"]),
            "type": str(row_raw["Type"]),
            "actual_failure": y_true,
            "failure_mode": failure_type,
            "predicted_failure": pred_class,
            "failure_probability": round(pred_prob, 4),
            "features": {col: round(float(x_row[col].values[0]), 2) for col in feature_names},
            "top_shap_attributions": attributions[:6]
        })
        
        if len([tc for tc in test_cases if tc["actual_failure"] == 1]) >= 8 and len([tc for tc in test_cases if tc["actual_failure"] == 0]) >= 8:
            break
            
    with open(os.path.join(artifacts_dir, "ai4i_test_cases.json"), "w") as f:
        json.dump(test_cases, f, indent=2)
        
    print("\nSaved artifacts to ml/artifacts/ai4i/:")
    print("- ai4i_champion_model.joblib")
    print("- ai4i_scaler.joblib")
    print("- feature_names.json")
    print("- ai4i_evaluation_metrics.json")
    print("- ai4i_test_cases.json")

if __name__ == "__main__":
    train_and_evaluate()
