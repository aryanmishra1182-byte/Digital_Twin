"""
Stage 1 Anomaly Detection Baseline: PyTorch Autoencoder
======================================================
Trains an unsupervised deep reconstruction Autoencoder strictly on HEALTHY windows.
Computes reconstruction error (MSE) as anomaly score.
Threshold is selected on the VALIDATION split to maximize F1.
Evaluated on the held-out TEST split (312 windows from 52 runs).
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
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import precision_recall_fscore_support, roc_auc_score

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from ml.features.feature_extractor import FEATURE_NAMES

class AnomalyAutoencoder(nn.Module):
    def __init__(self, input_dim: int = 26):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 16),
            nn.ReLU(),
            nn.Linear(16, 8),
            nn.ReLU(),
            nn.Linear(8, 4)
        )
        self.decoder = nn.Sequential(
            nn.Linear(4, 8),
            nn.ReLU(),
            nn.Linear(8, 16),
            nn.ReLU(),
            nn.Linear(16, input_dim)
        )

    def forward(self, x):
        z = self.encoder(x)
        return self.decoder(z)

def train_and_eval_autoencoder(data_dir: str = "data/processed", seed: int = 42):
    torch.manual_seed(seed)
    np.random.seed(seed)

    train_df = pd.read_csv(os.path.join(data_dir, "dataset_train.csv"))
    val_df = pd.read_csv(os.path.join(data_dir, "dataset_val.csv"))
    test_df = pd.read_csv(os.path.join(data_dir, "dataset_test.csv"))

    # Train ONLY on healthy samples
    train_healthy = train_df[train_df["fault_class"] == "HEALTHY"]
    scaler = StandardScaler()
    X_train_h = scaler.fit_transform(train_healthy[FEATURE_NAMES].values)

    X_val = scaler.transform(val_df[FEATURE_NAMES].values)
    y_val_anom = (val_df["fault_class"] != "HEALTHY").astype(int).values

    X_test = scaler.transform(test_df[FEATURE_NAMES].values)
    y_test_anom = (test_df["fault_class"] != "HEALTHY").astype(int).values

    train_loader = DataLoader(
        TensorDataset(torch.tensor(X_train_h, dtype=torch.float32)),
        batch_size=16,
        shuffle=True
    )

    model = AnomalyAutoencoder(input_dim=len(FEATURE_NAMES))
    optimizer = optim.Adam(model.parameters(), lr=0.005, weight_decay=1e-5)
    criterion = nn.MSELoss()

    model.train()
    for epoch in range(60):
        for (batch_x,) in train_loader:
            optimizer.zero_grad()
            reconstructed = model(batch_x)
            loss = criterion(reconstructed, batch_x)
            loss.backward()
            optimizer.step()

    model.eval()
    with torch.no_grad():
        val_recon = model(torch.tensor(X_val, dtype=torch.float32)).numpy()
        val_mse = np.mean((X_val - val_recon) ** 2, axis=1)

        test_recon = model(torch.tensor(X_test, dtype=torch.float32)).numpy()
        test_mse = np.mean((X_test - test_recon) ** 2, axis=1)

    # Choose optimal threshold on VALIDATION split only
    thresholds = np.percentile(val_mse, np.linspace(5, 95, 50))
    best_thresh = float(thresholds[0])
    best_val_f1 = -1.0

    for th in thresholds:
        preds = (val_mse > th).astype(int)
        _, _, f1, _ = precision_recall_fscore_support(y_val_anom, preds, average="binary", zero_division=0)
        if f1 > best_val_f1:
            best_val_f1 = f1
            best_thresh = float(th)

    # Evaluate chosen threshold on held-out test split
    test_preds = (test_mse > best_thresh).astype(int)
    p, r, f1, _ = precision_recall_fscore_support(y_test_anom, test_preds, average="binary", zero_division=0)
    roc_auc = float(roc_auc_score(y_test_anom, test_mse))

    results = {
        "model": "PyTorch_Autoencoder",
        "optimal_threshold_val": round(best_thresh, 4),
        "val_f1_at_threshold": round(best_val_f1, 4),
        "test_precision": round(float(p), 4),
        "test_recall": round(float(r), 4),
        "test_f1": round(float(f1), 4),
        "test_roc_auc": round(roc_auc, 4),
        "test_windows": len(test_df),
        "training_samples_healthy_only": len(X_train_h)
    }

    out_file = os.path.join("ml", "artifacts", "autoencoder_metrics.json")
    with open(out_file, "w") as f:
        json.dump(results, f, indent=2)

    print(f"[SUCCESS] Autoencoder Stage 1 Baseline Evaluated: F1={f1:.4f}, AUC={roc_auc:.4f}, P={p:.4f}, R={r:.4f}")
    return results

if __name__ == "__main__":
    train_and_eval_autoencoder()
