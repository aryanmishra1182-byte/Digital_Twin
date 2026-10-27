#!/usr/bin/env python
"""
CLI Script to generate training, validation, test, and RUL datasets.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.datasets.dataset_generator import generate_full_dataset, generate_degradation_dataset

def main():
    print("==========================================================")
    print("Generating Motor Digital Twin Research Datasets...")
    print("==========================================================")
    df, meta = generate_full_dataset(
        output_dir="data/processed",
        runs_per_condition=10,
        windows_per_run=10,
        loads=[25.0, 50.0, 75.0, 100.0],
        seed=42
    )
    print(f"Total samples: {meta['total_samples']}")
    print(f"Train samples: {meta['train_samples']}")
    print(f"Validation samples: {meta['val_samples']}")
    print(f"Test samples: {meta['test_samples']}")
    print("\nClass distribution:")
    for cls, count in meta['class_distribution'].items():
        print(f"  - {cls}: {count}")

    print("\nGenerating RUL Degradation Dataset...")
    df_rul = generate_degradation_dataset(
        output_dir="data/processed",
        runs_per_fault=3,
        total_hours=50.0,
        step_minutes=30.0,
        seed=101
    )
    print(f"Total RUL samples: {len(df_rul)} across {df_rul['run_id'].nunique()} degradation runs.")
    print("Datasets successfully generated and saved to data/processed/")

if __name__ == "__main__":
    main()
