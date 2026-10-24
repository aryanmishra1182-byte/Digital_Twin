"""
Run Locust Load Benchmark for MACHINA-X ML Service
==================================================
Runs headless Locust concurrent load test against http://localhost:8001.
Measures requests/sec, failure rate, and response time percentiles.
Saves results into ml/artifacts/locust_benchmark.json.
"""

import os
import sys
import json
import subprocess
import pandas as pd
from datetime import datetime, timezone

def run_locust_test():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    artifacts_dir = os.path.join(base_dir, "ml", "artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)

    csv_prefix = os.path.join(artifacts_dir, "locust_run")
    cmd = [
        sys.executable, "-m", "locust",
        "-f", os.path.join(base_dir, "tests", "locustfile.py"),
        "--headless",
        "-u", "10",
        "-r", "2",
        "--run-time", "12s",
        "--host", "http://127.0.0.1:8001",
        "--csv", csv_prefix
    ]

    print(f"Executing locust load test: {' '.join(cmd)}")
    res = subprocess.run(cmd, capture_output=True, text=True)
    print(res.stdout[-500:] if res.stdout else "No stdout")

    stats_csv = f"{csv_prefix}_stats.csv"
    if not os.path.exists(stats_csv):
        raise FileNotFoundError(f"Locust stats file not created: {stats_csv}")

    df_stats = pd.read_csv(stats_csv)
    # Aggregated row is typically the last row with Name = 'Aggregated'
    agg_row = df_stats[df_stats["Name"] == "Aggregated"]
    if agg_row.empty:
        agg_row = df_stats.iloc[-1:]

    total_requests = int(agg_row["Request Count"].values[0])
    failure_count = int(agg_row["Failure Count"].values[0])
    median_response_time = float(agg_row["Median Response Time"].values[0])
    avg_response_time = float(agg_row["Average Response Time"].values[0])
    req_per_sec = float(agg_row["Requests/s"].values[0])

    benchmark_summary = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "concurrent_users": 10,
        "spawn_rate": 2,
        "test_duration": "12s",
        "target_host": "http://127.0.0.1:8001",
        "total_requests": total_requests,
        "total_failures": failure_count,
        "failure_rate_pct": round(float(failure_count / (total_requests + 1e-6) * 100), 2),
        "requests_per_second": round(req_per_sec, 2),
        "median_response_time_ms": round(median_response_time, 2),
        "average_response_time_ms": round(avg_response_time, 2),
        "endpoints_evaluated": df_stats[df_stats["Name"] != "Aggregated"]["Name"].tolist(),
        "status": "PASS" if failure_count == 0 else "WARNING"
    }

    out_file = os.path.join(artifacts_dir, "locust_benchmark.json")
    with open(out_file, "w") as f:
        json.dump(benchmark_summary, f, indent=2)

    print(f"[SUCCESS] Locust benchmark completed and saved to {out_file}:")
    print(f"  Requests: {total_requests}, RPS: {req_per_sec:.2f}, Avg RT: {avg_response_time:.2f} ms, Failures: {failure_count}")

if __name__ == "__main__":
    run_locust_test()
