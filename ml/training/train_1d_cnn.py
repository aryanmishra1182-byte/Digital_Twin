"""
Stage 2 Fault Classifier Deep Baseline: 1-D CNN on Raw Waveforms
================================================================
Trains a 1-Dimensional Convolutional Neural Network directly on raw 10 kHz time series:
- Channel 0: Phase A Stator Current (10,000 samples)
- Channel 1: Radial Vibration (10,000 samples)
Input shape: (batch_size, 2, 10000)

Evaluates on held-out test split.
Generates ml/artifacts/cnn_1d_metrics.json.
"""

import os
import sys
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from simulator.motor_simulator import MotorSimulator, FAULT_CLASSES

class Motor1DCNN(nn.Module):
    def __init__(self, num_classes: int = 5):
        super().__init__()
        # Input: (B, 2, 10000)
        self.features = nn.Sequential(
            nn.Conv1d(2, 16, kernel_size=64, stride=4, padding=30),  # (B, 16, 2500)
            nn.BatchNorm1d(16),
            nn.ReLU(),
            nn.MaxPool1d(4),                                          # (B, 16, 625)

            nn.Conv1d(16, 32, kernel_size=32, stride=2, padding=15),  # (B, 32, 312)
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.MaxPool1d(4),                                          # (B, 32, 78)

            nn.Conv1d(32, 64, kernel_size=16, stride=2, padding=7),   # (B, 64, 39)
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(1)                                   # (B, 64, 1)
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.25),
            nn.Linear(32, num_classes)
        )

    def forward(self, x):
        feat = self.features(x)
        return self.classifier(feat)

def synthesize_split_raw_windows(df_split: pd.DataFrame, max_samples: int = 1200, seed: int = 42):
    """Reconstruct exact raw 10,000-sample windows matching split runs."""
    X_raw = []
    y_labels = []

    # If df_split is large, sample representative subset uniformly across classes
    if len(df_split) > max_samples:
        df_subset = df_split.groupby("fault_class", group_keys=False).apply(
            lambda g: g.sample(min(len(g), max_samples // len(FAULT_CLASSES)), random_state=seed)
        )
    else:
        df_subset = df_split

    for _, row in df_subset.iterrows():
        run_id = str(row["run_id"])
        fc = str(row["fault_class"])
        sev = float(row["severity"])
        load = float(row["load_pct"])
        t_start = float(row["timestamp"])

        sim = MotorSimulator(seed=seed + abs(hash(run_id)) % 100000)
        w = sim.generate_window(
            run_id=run_id,
            load_pct=load,
            fault_class=fc,
            severity=sev,
            t_start=t_start,
            noise_level=0.05
        )

        cur = w.current_signal
        vib = w.vibration_signal

        cur_norm = (cur - np.mean(cur)) / (np.std(cur) + 1e-6)
        vib_norm = (vib - np.mean(vib)) / (np.std(vib) + 1e-6)

        stacked = np.stack([cur_norm, vib_norm], axis=0)
        X_raw.append(stacked)
        y_labels.append(FAULT_CLASSES.index(fc))

    return np.array(X_raw, dtype=np.float32), np.array(y_labels, dtype=np.int64)

def train_and_eval_1d_cnn(data_dir: str = "data/processed", seed: int = 42):
    print("[1/4] Loading dataset splits...")
    train_df = pd.read_csv(os.path.join(data_dir, "dataset_train.csv"))
    val_df = pd.read_csv(os.path.join(data_dir, "dataset_val.csv"))
    test_df = pd.read_csv(os.path.join(data_dir, "dataset_test.csv"))

    print("[2/4] Synthesizing raw time-series windows (10,000 samples/ch)...")
    X_train, y_train = synthesize_split_raw_windows(train_df, max_samples=1500, seed=seed)
    X_val, y_val = synthesize_split_raw_windows(val_df, max_samples=400, seed=seed)
    X_test, y_test = synthesize_split_raw_windows(test_df, max_samples=500, seed=seed)

    torch.manual_seed(seed)
    np.random.seed(seed)

    train_loader = DataLoader(
        TensorDataset(torch.tensor(X_train), torch.tensor(y_train)),
        batch_size=64,
        shuffle=True
    )

    val_loader = DataLoader(
        TensorDataset(torch.tensor(X_val), torch.tensor(y_val)),
        batch_size=64,
        shuffle=False
    )

    test_loader = DataLoader(
        TensorDataset(torch.tensor(X_test), torch.tensor(y_test)),
        batch_size=64,
        shuffle=False
    )

    print("[3/4] Training 1-D CNN for 12 epochs...")
    model = Motor1DCNN(num_classes=len(FAULT_CLASSES))
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)

    best_val_acc = 0.0
    best_weights = None

    for epoch in range(12):
        model.train()
        for bx, by in train_loader:
            optimizer.zero_grad()
            logits = model(bx)
            loss = criterion(logits, by)
            loss.backward()
            optimizer.step()

        model.eval()
        val_preds = []
        with torch.no_grad():
            for bx, by in val_loader:
                preds = torch.argmax(model(bx), dim=1).numpy()
                val_preds.extend(preds)
        val_acc = accuracy_score(y_val, val_preds)
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_weights = {k: v.cpu().clone() for k, v in model.state_dict().items()}

    if best_weights:
        model.load_state_dict(best_weights)
    model.eval()
    test_preds = []
    with torch.no_grad():
        for bx, by in test_loader:
            preds = torch.argmax(model(bx), dim=1).numpy()
            test_preds.extend(preds)

    acc = float(accuracy_score(y_test, test_preds))
    macro_p, macro_r, macro_f1, _ = precision_recall_fscore_support(y_test, test_preds, average="macro", zero_division=0)

    print(f"[4/4] 1-D CNN Test Accuracy = {acc*100:.2f}%, Macro F1 = {macro_f1:.4f}")

    cnn_metrics = {
        "model": "1D_CNN_Raw_Waveforms",
        "input_channels": 2,
        "input_samples_per_channel": 10000,
        "parameters": sum(p.numel() for p in model.parameters() if p.requires_grad),
        "test_windows": len(y_test),
        "accuracy": round(acc, 4),
        "macro_precision": round(float(macro_p), 4),
        "macro_recall": round(float(macro_r), 4),
        "macro_f1": round(float(macro_f1), 4)
    }

    out_file = os.path.join("ml", "artifacts", "cnn_1d_metrics.json")
    with open(out_file, "w") as f:
        json.dump(cnn_metrics, f, indent=2)

    torch.save(model.state_dict(), os.path.join("ml", "artifacts", "cnn_1d_model.pt"))

    return cnn_metrics

if __name__ == "__main__":
    train_and_eval_1d_cnn()
