# Explainable Digital Twin Framework for Predictive Maintenance of Three-Phase Induction Motors

A complete, production-minded research and industrial application implementing an **Explainable Digital Twin** for three-phase induction motor predictive maintenance.

Based on the research specification:
> **"An Explainable Digital Twin Framework for Predictive Maintenance of Three-Phase Induction Motors"**  
> *Authors:* Aditya Gupta, Aditya Maurya, Ananya Sharma, Aryan Mishra  
> *Supervisor:* Ms. Monika Sharma  
> *Department of Computer Science and Engineering (Data Science), ABES Engineering College, Ghaziabad, Uttar Pradesh, India*

---

## 1. System Architecture

```mermaid
flowchart TD
    subgraph Edge & Physical Domain
        Motor["Three-Phase 3 kW Induction Motor\n(415V, 50 Hz, 4 Poles, ~1440 RPM, s≈0.04)"]
        Sensors["Sensors\n- Stator Phase Current (10 kHz)\n- Radial Vibration (10 kHz)\n- Winding Temperature (°C)"]
        Motor --> Sensors
    end

    subgraph Transport & Ingestion
        Sensors --> Ingest["Ingestion Options\n- REST API: /api/v1/telemetry/ingest\n- MQTT Broker: motors/+/telemetry"]
    end

    subgraph Backend Core
        Backend["Spring Boot 3 (Java 21) Digital Twin Core\n- Virtual Replica State Synchronizer\n- JPA Persistence (H2 / PostgreSQL)\n- Prioritized Alerts Engine (P1/P2/P3)\n- Rule-Based Maintenance Advisory\n- Simulator Stream Orchestration"]
        Ingest --> Backend
    end

    subgraph ML & Explainability Microservice
        ML["Python 3.10 ML Service (FastAPI :8001)\n- MCSA Spectral & Statistical Feature Extractor (26 Feats)\n- Stage 1: Isolation Forest Anomaly Detection (F1: 0.84)\n- Stage 2: XGBoost Fault Classifier (Acc: 94.55%)\n- Stage 3: PyTorch 2-Layer LSTM RUL Regressor (MAE: 0.22h)\n- Stage 4: SHAP TreeExplainer Attribution Engine"]
        Backend <--> ML
    end

    subgraph Operator Dashboard
        UI["React 18 + TypeScript + Vite Dashboard (:3000)\n- Fleet Asset Overview & Health Scores\n- Live Stator Current & Vibration Recharts\n- Multi-Stage Fault Diagnosis & Probability Distribution\n- Local SHAP Waterfall & Global Macro Importance\n- Remaining Useful Life Degradation Trajectories\n- Prioritized Maintenance Alerts & Inspection Actions\n- Interactive Telemetry Simulator Modal"]
        Backend --> UI
    end
```

---

## 2. Technology Stack

- **Backend**: Java 21 LTS, Spring Boot 3.3.4, Spring Data JPA, H2 Database (zero-config local dev), PostgreSQL driver, SpringDoc OpenAPI (Swagger UI), Eclipse Paho MQTT client.
- **Machine Learning**: Python 3.10, NumPy, SciPy (FFT, Hanning windowing), pandas, scikit-learn (Isolation Forest), XGBoost 3.2, PyTorch 2.14 (LSTM Sequence Regressor), SHAP 0.49 (TreeExplainer).
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (dark industrial theme), Lucide Icons, Recharts, TanStack Query.
- **Deployment**: Docker & Docker Compose, Windows PowerShell scripts.

---

## 3. Verified Benchmark Results

All models evaluated with **zero data leakage** using strict run-level partitioning across operating loads (25%, 50%, 75%, 100%):

| Model Stage | Candidate Algorithm | Primary Metric | Baseline Comparison |
|---|---|---|---|
| **Stage 1: Anomaly Detection** | Isolation Forest (`iso_forest_v1.0`) | **F1: 0.8377**, Precision: 99.05%, Recall: 72.57% | False Positive Rate: 8.33% on healthy |
| **Stage 2: Fault Classification** | XGBoost (`xgboost_classifier_v1.0`) | **Accuracy: 94.55%**, Macro F1: 0.8862 | Beats Random Forest (92.63%) & SVM (87.82%) |
| **Stage 3: RUL Estimation** | PyTorch LSTM (`lstm_rul_v1.0`) | **MAE: 0.22 hours**, RMSE: 0.29 hours | Beats Ridge Regression (MAE: 0.33 hours) |
| **Stage 4: Explainability** | SHAP TreeExplainer (`shap_v0.49`) | 26 Physics Features Attributed | Corroborated with MCSA and BPFO physics equations |

---

## 4. Quickstart Guide (Windows PowerShell)

### Prerequisites
- Java 21 (Temurin OpenJDK)
- Python 3.10+
- Node.js v20+ / npm

### Step 1: Clone and Generate Datasets & Train Models
```powershell
# Navigate to repository root
cd C:\Users\aryan\.gemini\antigravity\scratch\explainable-digital-twin

# 1. Generate run-level partitioned research dataset
python scripts/generate_dataset.py

# 2. Train all 3 ML stages and compute global SHAP values
python scripts/train_all_models.py
```

### Step 2: Launch All Services (One-Click)
```powershell
# Starts Python ML service, Spring Boot backend, and React dashboard in separate windows:
.\scripts\run_all.ps1
```

Or run each service individually:
```powershell
# Terminal 1: Python ML Microservice (Port 8001)
.\scripts\run_ml_service.ps1

# Terminal 2: Spring Boot Backend (Port 8080)
.\scripts\run_backend.ps1

# Terminal 3: React Frontend Dashboard (Port 3000)
.\scripts\run_frontend.ps1
```

### Step 3: Access the Applications
- **Industrial Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Interactive Swagger REST API Docs**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **H2 Database Web Console**: [http://localhost:8080/h2-console](http://localhost:8080/h2-console) (JDBC URL: `jdbc:h2:mem:motortwindb`, User: `sa`, Password: empty)
- **Python ML Microservice Health**: [http://localhost:8001/health](http://localhost:8001/health)

---

## 5. Running Automated Tests

### Python ML & Physics Tests
```powershell
# Run all Python unit and physics-consistency tests:
python -m pytest tests/ -v
```
Verified passing:
- `test_simulator_and_features.py`: Window dimensions, MCSA sidebands, bearing BPFO, stator harmonic ratio, eccentricity 1x shaft vibration (6/6 passed).
- `test_dataset_validation.py`: Zero data leakage between partitions, feature schema integrity (1/1 passed).
- `test_ml_pipeline.py`: Isolation Forest inlier scoring, XGBoost class probabilities, SHAP attribution physics consistency (3/3 passed).
- `test_ml_service.py`: FastAPI endpoints for health, feature extraction, inference, RUL sequences, and global importance (6/6 passed).

### Spring Boot Backend Integration Tests
```powershell
# Run Maven test suite:
cd backend
.\mvn.ps1 test
```
Verified passing:
- `HealthControllerTest`: Actuator readiness & health checks (2/2 passed).
- `DigitalTwinIntegrationTest`: Asset listing, registration, telemetry ingestion, digital twin health score synchronization, alert lifecycle (acknowledge/resolve), simulator controls (5/5 passed).

### React Frontend Build Verification
```powershell
cd frontend
npm run build
```
Verified passing: Vite production bundle built in 20.8s.

---

## 6. Dashboard Pages & Capabilities

1. **Fleet Overview**: Total assets summary, health score meters, quick telemetry simulator launch button, real-time alert feed.
2. **Motor Detail**: Rated motor electrical/mechanical specifications, live charts for Stator Current RMS, Radial Vibration RMS & Kurtosis, Winding Temperature, and BRB Sideband Ratio.
3. **Fault Diagnosis**: Stage 1 Anomaly Detection gauge, Stage 2 XGBoost classification badge, class probability distribution bar chart, unknown anomaly detection handling.
4. **SHAP Explainability**: Local per-prediction waterfall / horizontal bar chart with percentage contributions and direction tags, Global macro feature importance rankings, qualitative physics-consistency checklist.
5. **Remaining Useful Life (RUL)**: Live RUL hours countdown, degradation trajectory tracking, LSTM sequence window status.
6. **Alerts & Maintenance**: Prioritized P1/P2/P3 table, rule-based suggested inspection checklists (MCSA sidebands, Megger test, envelope demodulation), Acknowledge and Resolve actions with operator notes.
7. **Model & System Status**: Architecture component health, model versions, evaluation benchmarks, and telemetry stream stats.

---

## 7. Academic Research Provenance & Disclaimer

- **Provenance**: Synthetic Simulation based on IEEE motor parameters (3 kW, 415 V, 50 Hz, 4 poles).
- **Caveat**: Performance on simulated degradation trajectories measures agreement with the mathematical model target, not physical motor lifetime without hardware bench calibration.
- **Safety**: The advisory system is decision-support only; it does not automatically trip machinery or bypass safety interlocks.
