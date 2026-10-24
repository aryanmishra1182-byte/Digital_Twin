"""
Stage 3: Remaining Useful Life (RUL) Modeling and Evaluation
===========================================================
Trains a sequence-based PyTorch LSTM regressor alongside:
- Gradient Boosting Regressor baseline
- Ridge Regression baseline
- Dummy Mean baseline
to predict Remaining Useful Life (in hours) from temporal feature sequences.
Evaluated on strictly held-out degradation trajectories.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Tuple
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.dummy import DummyRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from ml.features.feature_extractor import FEATURE_NAMES

MODEL_VERSION = "lstm_rul_v1.0"
SEQUENCE_LENGTH = 5  # number of consecutive historical windows

class RULSequenceDataset(Dataset):
    def __init__(self, sequences: np.ndarray, targets: np.ndarray):
        self.sequences = torch.tensor(sequences, dtype=torch.float32)
        self.targets = torch.tensor(targets, dtype=torch.float32).unsqueeze(1)

    def __len__(self):
        return len(self.sequences)

    def __getitem__(self, idx):
        return self.sequences[idx], self.targets[idx]

class LSTMRULModel(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 32, num_layers: int = 2):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers=num_layers, batch_first=True, dropout=0.1)
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, 16),
            nn.ReLU(),
            nn.Linear(16, 1)
        )

    def forward(self, x):
        out, _ = self.lstm(x)
        last_out = out[:, -1, :]
        pred = self.fc(last_out)
        return pred

def create_sequences(df: pd.DataFrame, feature_cols: list, seq_length: int = 5) -> Tuple[np.ndarray, np.ndarray]:
    """Create temporal sequences grouped strictly by run_id to avoid sequence leakage."""
    sequences, targets = [], []
    for run_id, group in df.groupby("run_id"):
        group_sorted = group.sort_values("step_idx")
        feats = group_sorted[feature_cols].values
        ruls = group_sorted["rul_hours"].values
        if len(feats) < seq_length:
            continue
        for i in range(len(feats) - seq_length + 1):
            sequences.append(feats[i : i + seq_length])
            targets.append(ruls[i + seq_length - 1])
    return np.array(sequences), np.array(targets)

def train_rul_model(
    data_dir: str = "data/processed",
    output_dir: str = "ml/artifacts",
    epochs: int = 40,
    lr: float = 0.005,
    random_state: int = 42
) -> dict:
    os.makedirs(output_dir, exist_ok=True)
    rul_file = os.path.join(data_dir, "dataset_rul.csv")
    if not os.path.exists(rul_file):
        raise FileNotFoundError(f"RUL dataset not found at {rul_file}")

    df = pd.read_csv(rul_file)
    train_df = df[df["split"] == "train"].copy()
    test_df = df[df["split"] == "test"].copy()

    # Fit scaler strictly on training features
    scaler = StandardScaler()
    scaler.fit(train_df[FEATURE_NAMES].values)

    train_df[FEATURE_NAMES] = scaler.transform(train_df[FEATURE_NAMES].values)
    test_df[FEATURE_NAMES] = scaler.transform(test_df[FEATURE_NAMES].values)

    X_train_seq, y_train_seq = create_sequences(train_df, FEATURE_NAMES, SEQUENCE_LENGTH)
    X_test_seq, y_test_seq = create_sequences(test_df, FEATURE_NAMES, SEQUENCE_LENGTH)

    X_train_flat = X_train_seq[:, -1, :]
    X_test_flat = X_test_seq[:, -1, :]

    # 1. Baseline: Mean Dummy Regressor
    dummy = DummyRegressor(strategy="mean")
    dummy.fit(X_train_flat, y_train_seq)
    y_pred_dummy = dummy.predict(X_test_flat)
    mae_dummy = float(mean_absolute_error(y_test_seq, y_pred_dummy))
    rmse_dummy = float(np.sqrt(mean_squared_error(y_test_seq, y_pred_dummy)))

    # 2. Baseline: Ridge Regression
    ridge = Ridge()
    ridge.fit(X_train_flat, y_train_seq)
    y_pred_ridge = ridge.predict(X_test_flat)
    mae_ridge = float(mean_absolute_error(y_test_seq, y_pred_ridge))
    rmse_ridge = float(np.sqrt(mean_squared_error(y_test_seq, y_pred_ridge)))

    # 3. Baseline: Gradient Boosting Regressor
    gbr = GradientBoostingRegressor(n_estimators=100, max_depth=4, random_state=random_state)
    gbr.fit(X_train_flat, y_train_seq)
    y_pred_gbr = gbr.predict(X_test_flat)
    mae_gbr = float(mean_absolute_error(y_test_seq, y_pred_gbr))
    rmse_gbr = float(np.sqrt(mean_squared_error(y_test_seq, y_pred_gbr)))

    # 4. Proposed Candidate: LSTM Sequence Regressor
    torch.manual_seed(random_state)
    train_dataset = RULSequenceDataset(X_train_seq, y_train_seq)
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)

    input_dim = len(FEATURE_NAMES)
    model = LSTMRULModel(input_dim=input_dim, hidden_dim=32, num_layers=2)
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)

    model.train()
    for epoch in range(epochs):
        for seq_batch, target_batch in train_loader:
            optimizer.zero_grad()
            preds = model(seq_batch)
            loss = criterion(preds, target_batch)
            loss.backward()
            optimizer.step()

    # Evaluation on held-out test runs
    model.eval()
    with torch.no_grad():
        test_inputs = torch.tensor(X_test_seq, dtype=torch.float32)
        test_preds = model(test_inputs).squeeze(1).numpy()

    mae_lstm = float(mean_absolute_error(y_test_seq, test_preds))
    rmse_lstm = float(np.sqrt(mean_squared_error(y_test_seq, test_preds)))

    evaluation_summary = {
        "model_version": MODEL_VERSION,
        "primary_model": "LSTM_Sequence_Regressor",
        "sequence_length": SEQUENCE_LENGTH,
        "mae_hours": round(mae_lstm, 4),
        "rmse_hours": round(rmse_lstm, 4),
        "baseline_comparison": {
            "LSTM": {"mae_hours": round(mae_lstm, 4), "rmse_hours": round(rmse_lstm, 4)},
            "GradientBoosting": {"mae_hours": round(mae_gbr, 4), "rmse_hours": round(rmse_gbr, 4)},
            "Ridge_Baseline": {"mae_hours": round(mae_ridge, 4), "rmse_hours": round(rmse_ridge, 4)},
            "Mean_Baseline": {"mae_hours": round(mae_dummy, 4), "rmse_hours": round(rmse_dummy, 4)}
        },
        "test_sequences": len(y_test_seq),
        "held_out_runs": test_df["run_id"].nunique(),
        "limitations": "Evaluated against simulated degradation trajectories; physical bench calibration required for real operating environments.",
        "provenance": "Synthetic Simulation Multi-Law Degradation Trajectories (Linear, Exponential, Power-law)"
    }

    model_state_path = os.path.join(output_dir, "rul_lstm_model.pt")
    torch.save(model.state_dict(), model_state_path)

    bundle = {
        "scaler": scaler,
        "feature_names": FEATURE_NAMES,
        "sequence_length": SEQUENCE_LENGTH,
        "input_dim": input_dim,
        "hidden_dim": 32,
        "num_layers": 2,
        "model_version": MODEL_VERSION,
        "evaluation_summary": evaluation_summary
    }
    joblib.dump(bundle, os.path.join(output_dir, "rul_model_bundle.joblib"))

    with open(os.path.join(output_dir, "rul_metrics.json"), "w") as f:
        json.dump(evaluation_summary, f, indent=2)

    print(f"RUL LSTM model trained and saved to {model_state_path}")
    print(f"LSTM: MAE={mae_lstm:.2f} hrs, RMSE={rmse_lstm:.2f} hrs")
    print(f"Gradient Boosting: MAE={mae_gbr:.2f} hrs, RMSE={rmse_gbr:.2f} hrs")
    print(f"Ridge: MAE={mae_ridge:.2f} hrs, RMSE={rmse_ridge:.2f} hrs")
    print(f"Mean Dummy: MAE={mae_dummy:.2f} hrs, RMSE={rmse_dummy:.2f} hrs")
    return evaluation_summary

if __name__ == "__main__":
    train_rul_model()
