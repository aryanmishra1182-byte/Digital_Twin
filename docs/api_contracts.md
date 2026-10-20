# REST API Contracts: Motor Digital Twin Backend

All endpoints are hosted on port `8080` under `/api/v1` (with interactive OpenAPI docs at `/swagger-ui.html`).

## 1. Asset & Digital Twin Endpoints
- `GET /api/v1/motors`: List all registered motor assets.
- `GET /api/v1/motors/{id}`: Get specific motor configuration.
- `POST /api/v1/motors`: Register a new motor configuration.
- `GET /api/v1/twin`: List all synchronized digital twin states.
- `GET /api/v1/twin/{motorId}`: Retrieve real-time twin state, health score, predictions, and recommendations for a motor.

## 2. Ingestion & Telemetry Endpoints
- `POST /api/v1/telemetry/ingest`:
  - Request Body:
    ```json
    {
      "motorId": "MOTOR-001",
      "runId": "RUN-001",
      "loadPct": 100.0,
      "temperatureC": 42.5,
      "features": { ... } // or raw arrays "currentSignal" and "vibrationSignal"
    }
    ```
  - Response: Synchronized `DigitalTwinResponse` object.
- `GET /api/v1/telemetry/history/{motorId}?limit=30`: Retrieve chronological telemetry points.

## 3. Predictions and Explainability Endpoints
- `GET /api/v1/predictions/history/{motorId}?limit=30`: Historical inference records.
- `GET /api/v1/predictions/latest/{motorId}`: Latest prediction with class probability distribution.
- `GET /api/v1/predictions/shap/latest/{motorId}`: Latest local SHAP feature attributions.
- `GET /api/v1/predictions/global-importance`: Macro global SHAP rankings.

## 4. Alerts and Advisory Endpoints
- `GET /api/v1/alerts?motorId=...&status=...`: Query alerts by motor and status (`ACTIVE`, `ACKNOWLEDGED`, `RESOLVED`).
- `PUT /api/v1/alerts/{id}/acknowledge`: Acknowledge an alert with operator note.
- `PUT /api/v1/alerts/{id}/resolve`: Resolve an alert with resolution note.

## 5. Simulator Control Endpoints
- `GET /api/v1/simulator/status`: Current simulator state, scenario, active load, severity, and ticks.
- `POST /api/v1/simulator/start?motorId=...&scenario=...&severity=...&loadPct=...`: Start live background telemetry stream.
- `POST /api/v1/simulator/stop`: Stop background telemetry stream.

## 6. System Status Endpoint
- `GET /api/v1/status`: Comprehensive status including Spring Boot backend, Java runtime, and Python ML microservice health.
