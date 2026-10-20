# Evaluation Protocol: Research Validation and Benchmark Guidelines

## 1. Zero-Leakage Partitioning Protocol
In motor telemetry data, consecutive 1-second windows drawn from the same experimental or simulation run exhibit strong autocorrelation. Random window-level splitting causes catastrophic data leakage between training and evaluation partitions.

To prevent leakage:
1. **Partition Unit**: Independent simulation runs (`run_id`).
2. **Train / Val / Test Assignment**:
   - Runs 1 & 2 -> Training Partition (50%)
   - Run 3 -> Validation Partition (25%)
   - Run 4 -> Held-Out Test Partition (25%)
3. **Automated Verification**: Automated test (`tests/test_dataset_validation.py`) verifies that the intersection of Run IDs across partitions is empty:
   $$\text{RunIDs}_{\text{train}} \cap \text{RunIDs}_{\text{test}} = \emptyset$$

## 2. Generalization Assessment Across Operating Loads
Induction motors operate across variable industrial loading cycles (e.g. 25%, 50%, 75%, 100%). The evaluation protocol tests model robustness by verifying performance across all 4 load points, accounting for load-dependent changes in slip:
$$s(L) = s_{\text{nominal}} \times \left(\frac{L}{100}\right)$$
And corresponding shifts in broken-rotor-bar sideband frequencies:
$$f_{br}(L) = f_s(1 \pm 2ks(L))$$

## 3. Evaluation Metrics
- **Anomaly Detection**: Precision, Recall, Macro F1, False Positive Rate (FPR), Confusion Matrix.
- **Multiclass Fault Classification**: Per-class Precision, Recall, F1-score, Macro F1, Confusion Matrix.
- **RUL Prognostics**: Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE) against progressive time-to-failure trajectories.
- **Explainability**: Qualitative physics-consistency review verifying that top SHAP attributions correspond to governing electromechanical equations.
