import argparse
import json
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List

import httpx

from simulator.generator import VitalGenerator
from simulator.scenarios import SCENARIOS, Scenario


def load_patients(seed_path: Path) -> List[Dict]:
    return json.loads(seed_path.read_text())


def authenticate(base_url: str, username: str, password: str) -> str:
    response = httpx.post(f"{base_url}/api/v1/auth/login", json={"username": username, "password": password})
    response.raise_for_status()
    return response.json()["access_token"]


def ingest_measurements(base_url: str, token: str, patient_id: str, measurements: List[Dict]) -> None:
    headers = {"Authorization": f"Bearer {token}"}
    response = httpx.post(
        f"{base_url}/api/v1/vitals/ingest",
        json={"patient_id": patient_id, "measurements": measurements},
        headers=headers,
        timeout=10,
    )
    response.raise_for_status()


def run_simulation(args: argparse.Namespace) -> None:
    seed_path = Path(args.seed_path)
    patients = load_patients(seed_path)
    generator = VitalGenerator(seed=args.seed)
    scenario = SCENARIOS[args.scenario]
    if args.event:
        overrides = {}
        for pair in args.event.split(","):
            metric, multiplier = pair.split("=")
            overrides[metric.strip()] = float(multiplier)
        scenario = Scenario(
            name=f"{scenario.name}_custom_event",
            drift_per_hour=scenario.drift_per_hour,
            acute_event_multiplier=overrides,
            acute_event_start_minute=args.event_start_minute,
            acute_event_duration_minutes=args.event_duration_minutes,
        )
    token = authenticate(args.base_url, args.username, args.password)

    start_time = datetime.utcnow()
    total_minutes = args.duration_minutes
    step = args.sample_frequency_seconds
    for minute in range(0, total_minutes):
        timestamp = start_time + timedelta(minutes=minute)
        for patient in patients:
            baseline = patient.get("baseline_profile", {})
            measurements = generator.generate(baseline, scenario, timestamp, minutes_elapsed=minute)
            ingest_measurements(args.base_url, token, patient["id"], measurements)
        time.sleep(step)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="RPM Simulator Runner")
    parser.add_argument("--base-url", default="http://localhost:8000")
    parser.add_argument("--seed-path", default="backend/data/seed_patients.json")
    parser.add_argument("--username", default="simulator")
    parser.add_argument("--password", default="simulator123")
    parser.add_argument("--scenario", choices=SCENARIOS.keys(), default="stable")
    parser.add_argument("--duration-minutes", type=int, default=60)
    parser.add_argument("--sample-frequency-seconds", type=int, default=5)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--event", help="Comma-separated metric multipliers, e.g. heart_rate=1.4,spo2=0.88")
    parser.add_argument("--event-start-minute", type=int, default=20)
    parser.add_argument("--event-duration-minutes", type=int, default=10)
    return parser


if __name__ == "__main__":
    run_simulation(build_parser().parse_args())
