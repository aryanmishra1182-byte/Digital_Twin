"""
Locust load test script for MACHINA-X ML service.
Simulates concurrent telemetry ingestion and inference requests to verify real-time latency.

Usage:
    locust -f tests/locustfile.py --headless -u 10 -r 2 --run-time 30s --host http://localhost:8001
"""

from locust import HttpUser, task, between
import json

SAMPLE_FEATURES = {
    "current_rms": 5.8,
    "current_fundamental_amp": 8.2,
    "current_dominant_freq": 50.0,
    "current_thd": 0.02,
    "current_harm_3_ratio": 0.015,
    "current_harm_5_ratio": 0.008,
    "brb_left_sideband_amp": 0.05,
    "brb_right_sideband_amp": 0.05,
    "brb_sideband_ratio": 0.006,
    "eccentricity_sideband_amp": 0.02,
    "vib_rms": 0.5,
    "vib_std": 0.5,
    "vib_peak": 1.2,
    "vib_peak_to_peak": 2.4,
    "vib_crest_factor": 2.4,
    "vib_kurtosis": 3.0,
    "vib_skewness": 0.05,
    "vib_bpfo_energy": 0.001,
    "vib_bpfi_energy": 0.001,
    "vib_1x_shaft_amp": 0.4,
    "temp_mean": 45.0,
    "temp_max": 46.2,
    "temp_rate_of_rise": 0.02,
    "load_pct": 100.0,
    "estimated_speed_rpm": 1440.0,
    "estimated_slip": 0.04
}

class MachinaXMLUser(HttpUser):
    wait_time = between(0.1, 0.4)

    @task(3)
    def test_health_check(self):
        self.client.get("/health")

    @task(3)
    def test_metrics_endpoint(self):
        self.client.get("/metrics/motor")

    @task(2)
    def test_global_importance(self):
        self.client.get("/global-importance")

    @task(5)
    def test_pipeline_prediction(self):
        payload = {"features": SAMPLE_FEATURES}
        headers = {"Content-Type": "application/json"}
        self.client.post("/infer", data=json.dumps(payload), headers=headers)
