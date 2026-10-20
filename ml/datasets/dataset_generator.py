"""
Dataset Generation and Partitioning Module
==========================================
Generates labeled simulation datasets with strict run-level partitioning
to guarantee zero data leakage between Train, Validation, and Test splits.
Also supports held-out load partitioning for generalization benchmarking.
"""

import os
import json
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from simulator.motor_simulator import MotorSimulator, MotorParams, FAULT_CLASSES
from ml.features.feature_extractor import FeatureExtractor, FEATURE_NAMES

def generate_full_dataset(
    output_dir: str = "data/processed",
    runs_per_condition: int = 4,
    windows_per_run: int = 10,
    loads: List[float] = [25.0, 50.0, 75.0, 100.0],
    seed: int = 42
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Generate dataset across all 5 fault classes and 4 load levels.
    Splits by run_id:
    - 2 runs -> Train (50%)
    - 1 run  -> Validation (25%)
    - 1 run  -> Test (25%)
    """
    os.makedirs(output_dir, exist_ok=True)
    extractor = FeatureExtractor()
    records = []

    global_run_idx = 0
    rng = np.random.RandomState(seed)

    for fault_class in FAULT_CLASSES:
        severities = [0.0] if fault_class == "HEALTHY" else [0.3, 0.6, 0.9]
        for severity in severities:
            for load_pct in loads:
                for run_in_cond in range(runs_per_condition):
                    global_run_idx += 1
                    run_id = f"RUN_{fault_class[:3]}_{int(load_pct)}_{int(severity*100)}_{run_in_cond+1:02d}_{global_run_idx:04d}"
                    # Assign partition by run_in_cond to avoid leakage
                    if run_in_cond == 0 or run_in_cond == 1:
                        split = "train"
                    elif run_in_cond == 2:
                        split = "val"
                    else:
                        split = "test"

                    sim = MotorSimulator(seed=seed + global_run_idx)
                    for win_idx in range(windows_per_run):
                        t_start = win_idx * 1.0
                        window = sim.generate_window(
                            run_id=run_id,
                            load_pct=load_pct,
                            fault_class=fault_class,
                            severity=severity,
                            t_start=t_start,
                            noise_level=0.03 + 0.02 * rng.rand()
                        )
                        feat_dict = extractor.extract_features(
                            current_signal=window.current_signal,
                            vibration_signal=window.vibration_signal,
                            temperature_c=window.temperature_c,
                            prev_temperature_c=window.prev_temperature_c,
                            load_pct=load_pct,
                            window_duration_s=1.0
                        )
                        record = {
                            "motor_id": window.motor_id,
                            "run_id": run_id,
                            "window_idx": win_idx,
                            "timestamp": t_start,
                            "load_pct": load_pct,
                            "severity": severity,
                            "fault_class": fault_class,
                            "fault_label": FAULT_CLASSES.index(fault_class),
                            "split": split,
                            "provenance": "Synthetic Simulation"
                        }
                        record.update(feat_dict)
                        records.append(record)

    df = pd.DataFrame(records)
    
    # Save complete dataset and partitioned splits
    full_path = os.path.join(output_dir, "dataset_full.csv")
    train_path = os.path.join(output_dir, "dataset_train.csv")
    val_path = os.path.join(output_dir, "dataset_val.csv")
    test_path = os.path.join(output_dir, "dataset_test.csv")

    df.to_csv(full_path, index=False)
    df[df["split"] == "train"].to_csv(train_path, index=False)
    df[df["split"] == "val"].to_csv(val_path, index=False)
    df[df["split"] == "test"].to_csv(test_path, index=False)

    metadata = {
        "total_samples": len(df),
        "total_runs": df["run_id"].nunique(),
        "train_samples": int((df["split"] == "train").sum()),
        "val_samples": int((df["split"] == "val").sum()),
        "test_samples": int((df["split"] == "test").sum()),
        "fault_classes": FAULT_CLASSES,
        "class_distribution": df["fault_class"].value_counts().to_dict(),
        "load_distribution": df["load_pct"].value_counts().to_dict(),
        "feature_names": FEATURE_NAMES,
        "provenance": "Synthetic Simulation (IEEE Paper Spec 3kW 415V 50Hz Motor)"
    }

    with open(os.path.join(output_dir, "dataset_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    return df, metadata

def generate_degradation_dataset(
    output_dir: str = "data/processed",
    runs_per_fault: int = 3,
    total_hours: float = 60.0,
    step_minutes: float = 15.0,
    seed: int = 101
) -> pd.DataFrame:
    """
    Generate progressive degradation runs for Remaining Useful Life (RUL) modeling.
    RUL target is defined in hours until failure (elapsed_hours = 0 -> RUL = total_hours).
    """
    os.makedirs(output_dir, exist_ok=True)
    extractor = FeatureExtractor()
    records = []
    fault_candidates = ["BROKEN_ROTOR_BAR", "STATOR_INTER_TURN_SHORT", "BEARING_DEFECT", "AIR_GAP_ECCENTRICITY"]

    run_counter = 0
    for fault_class in fault_candidates:
        for r in range(runs_per_fault):
            run_counter += 1
            run_id = f"RUL_{fault_class[:3]}_{r+1:02d}"
            split = "train" if r < 2 else "test"
            sim = MotorSimulator(seed=seed + run_counter)
            windows = sim.simulate_degradation_run(
                run_id=run_id,
                fault_class=fault_class,
                total_hours=total_hours,
                step_minutes=step_minutes,
                load_pct=100.0
            )
            for idx, w in enumerate(windows):
                elapsed_hours = (idx * step_minutes) / 60.0
                rul_hours = max(0.0, total_hours - elapsed_hours)
                feat_dict = extractor.extract_features(
                    current_signal=w.current_signal,
                    vibration_signal=w.vibration_signal,
                    temperature_c=w.temperature_c,
                    prev_temperature_c=w.prev_temperature_c,
                    load_pct=w.load_pct
                )
                rec = {
                    "motor_id": w.motor_id,
                    "run_id": run_id,
                    "step_idx": idx,
                    "elapsed_hours": elapsed_hours,
                    "rul_hours": rul_hours,
                    "fault_class": w.fault_class,
                    "severity": w.severity,
                    "split": split,
                    "provenance": "Synthetic Simulation Degradation Trajectory"
                }
                rec.update(feat_dict)
                records.append(rec)

    df_rul = pd.DataFrame(records)
    rul_path = os.path.join(output_dir, "dataset_rul.csv")
    df_rul.to_csv(rul_path, index=False)
    return df_rul

if __name__ == "__main__":
    print("Generating full multi-class and load dataset...")
    df, meta = generate_full_dataset(runs_per_condition=4, windows_per_run=5)
    print(f"Generated {len(df)} samples across {meta['total_runs']} runs.")
    print("Generating RUL degradation dataset...")
    df_rul = generate_degradation_dataset(total_hours=40.0, step_minutes=30.0)
    print(f"Generated {len(df_rul)} RUL degradation samples.")
