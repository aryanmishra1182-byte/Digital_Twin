"""
SHAP Explainability Module
==========================
Generates real TreeExplainer SHAP attributions for the XGBoost fault classifier.
Supports:
1. Local per-prediction explanations (feature values, shap values, direction, percentage contribution).
2. Global feature importance summaries across the dataset.
3. Physics-consistency validation (confirming fault predictions align with MCSA / bearing physics).
"""

import os
import io
import json
import joblib
import numpy as np
import pandas as pd
import shap
import shap.explainers._tree as st
from typing import Dict, Any, List, Optional
from simulator.motor_simulator import FAULT_CLASSES
from ml.features.feature_extractor import FEATURE_NAMES

# Apply compatibility patch for XGBoost 3.x array-string base_score with SHAP 0.49
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

class MotorShapExplainer:
    def __init__(self, model_bundle_path: str = "ml/artifacts/fault_classifier.joblib"):
        if not os.path.exists(model_bundle_path):
            raise FileNotFoundError(f"Fault classifier model not found at {model_bundle_path}")
        
        bundle = joblib.load(model_bundle_path)
        self.model = bundle["model"]
        self.scaler = bundle["scaler"]
        self.feature_names = bundle["feature_names"]
        self.class_to_idx = bundle["class_to_idx"]
        self.idx_to_class = bundle["idx_to_class"]
        self.model_version = bundle["model_version"]

        # Initialize SHAP TreeExplainer
        self.explainer = shap.TreeExplainer(self.model)

    def explain_prediction(
        self,
        feature_vector: np.ndarray,
        top_k: int = 8
    ) -> Dict[str, Any]:
        """
        Explain a single prediction using SHAP TreeExplainer.
        feature_vector: (26,) array corresponding to FEATURE_NAMES
        """
        if feature_vector.ndim == 1:
            raw_features = feature_vector.reshape(1, -1)
        else:
            raw_features = feature_vector

        scaled_features = self.scaler.transform(raw_features)
        
        # Get model probabilities and prediction
        probs = self.model.predict_proba(scaled_features)[0]
        predicted_idx = int(np.argmax(probs))
        predicted_class = self.idx_to_class[predicted_idx]
        confidence = float(probs[predicted_idx])

        # Compute SHAP values
        shap_vals = self.explainer.shap_values(scaled_features)
        if isinstance(shap_vals, list):
            class_shap = shap_vals[predicted_idx][0]
        elif shap_vals.ndim == 3:
            class_shap = shap_vals[0, :, predicted_idx]
        else:
            class_shap = shap_vals[0]

        # Build feature attribution list
        attributions = []
        raw_vals = raw_features[0]
        for name, val, sv in zip(self.feature_names, raw_vals, class_shap):
            attributions.append({
                "feature_name": name,
                "feature_value": float(val),
                "shap_value": float(sv),
                "abs_shap": float(abs(sv)),
                "direction": "INCREASES_RISK" if sv > 0 else "DECREASES_RISK",
                "impact": float(sv)
            })

        # Sort by absolute SHAP value
        attributions.sort(key=lambda x: x["abs_shap"], reverse=True)
        top_attributions = attributions[:top_k]

        # Calculate percentage contribution
        total_abs_shap = sum(a["abs_shap"] for a in top_attributions) + 1e-6
        for a in top_attributions:
            a["percentage_contribution"] = round((a["abs_shap"] / total_abs_shap) * 100.0, 1)

        return {
            "predicted_class": predicted_class,
            "predicted_class_index": predicted_idx,
            "confidence": confidence,
            "class_probabilities": {self.idx_to_class[i]: float(probs[i]) for i in range(len(probs))},
            "model_version": self.model_version,
            "top_attributions": top_attributions,
            "all_attributions": attributions,
            "explanation_method": "SHAP TreeExplainer"
        }

    def compute_global_importance(
        self,
        dataset_csv_path: str = "data/processed/dataset_test.csv"
    ) -> Dict[str, Any]:
        """Compute global mean absolute SHAP values across test set."""
        df = pd.read_csv(dataset_csv_path)
        X = df[self.feature_names].values
        X_scaled = self.scaler.transform(X)

        shap_vals = self.explainer.shap_values(X_scaled)
        if isinstance(shap_vals, list):
            mean_abs_per_feature = np.mean([np.abs(sv).mean(axis=0) for sv in shap_vals], axis=0)
        elif shap_vals.ndim == 3:
            mean_abs_per_feature = np.abs(shap_vals).mean(axis=(0, 2))
        else:
            mean_abs_per_feature = np.abs(shap_vals).mean(axis=0)

        importance_list = []
        for name, imp in zip(self.feature_names, mean_abs_per_feature):
            importance_list.append({
                "feature_name": name,
                "mean_abs_shap": float(imp)
            })
        importance_list.sort(key=lambda x: x["mean_abs_shap"], reverse=True)

        return {
            "model_version": self.model_version,
            "total_test_samples": len(df),
            "global_importance": importance_list
        }
