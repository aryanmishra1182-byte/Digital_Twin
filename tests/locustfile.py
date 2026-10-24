"""
Locust load test script for MACHINA-X ML service.
Simulates concurrent telemetry ingestion and inference requests to verify real-time latency.

Usage:
    locust -f tests/locustfile.py --headless -u 10 -r 2 --run-time 30s --host http://localhost:8001
"""

from locust import HttpUser, task, between
import json

class MachinaXMLUser(HttpUser):
    wait_time = between(0.1, 0.5)

    @task(3)
    def test_health_check(self):
        self.client.get("/health")

    @task(2)
    def test_metrics_endpoint(self):
        self.client.get("/metrics/motor")

    @task(5)
    def test_pipeline_prediction(self):
        # 26 synthetic features payload
        payload = {
            "features": [
                4.15, 0.12, 1.41, 0.05, 0.08, 0.02, 0.01, 0.015,
                0.03, 0.02, 0.85, 0.04, 3.2, 0.5, 0.01, 0.02,
                0.01, 0.03, 0.02, 0.01, 48.5, 0.1, 0.02, 0.98,
                0.01, 0.02
            ]
        }
        headers = {"Content-Type": "application/json"}
        self.client.post("/predict/pipeline", data=json.dumps(payload), headers=headers)

    @task(2)
    def test_explain_prediction(self):
        payload = {
            "features": [
                4.15, 0.12, 1.41, 0.05, 0.08, 0.02, 0.01, 0.015,
                0.03, 0.02, 0.85, 0.04, 3.2, 0.5, 0.01, 0.02,
                0.01, 0.03, 0.02, 0.01, 48.5, 0.1, 0.02, 0.98,
                0.01, 0.02
            ],
            "top_k": 5
        }
        headers = {"Content-Type": "application/json"}
        self.client.post("/predict/explain", data=json.dumps(payload), headers=headers)
