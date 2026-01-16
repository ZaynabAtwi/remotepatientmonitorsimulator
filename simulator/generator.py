import math
import random
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List

from simulator.scenarios import Scenario


@dataclass
class MetricSpec:
    unit: str
    normal_low: float
    normal_high: float
    circadian_amp: float


METRICS: Dict[str, MetricSpec] = {
    "heart_rate": MetricSpec(unit="bpm", normal_low=60, normal_high=100, circadian_amp=6),
    "bp_systolic": MetricSpec(unit="mmHg", normal_low=90, normal_high=130, circadian_amp=5),
    "bp_diastolic": MetricSpec(unit="mmHg", normal_low=60, normal_high=85, circadian_amp=3),
    "spo2": MetricSpec(unit="%", normal_low=93, normal_high=100, circadian_amp=0.8),
    "temperature": MetricSpec(unit="C", normal_low=36.1, normal_high=37.4, circadian_amp=0.2),
    "respiratory_rate": MetricSpec(unit="rpm", normal_low=12, normal_high=20, circadian_amp=1.5),
    "blood_glucose": MetricSpec(unit="mg/dL", normal_low=70, normal_high=140, circadian_amp=8),
    "activity": MetricSpec(unit="steps", normal_low=0, normal_high=12000, circadian_amp=1200),
}


class VitalGenerator:
    def __init__(self, seed: int = 42) -> None:
        self.random = random.Random(seed)

    def _circadian(self, metric: str, timestamp: datetime) -> float:
        spec = METRICS[metric]
        hour = timestamp.hour + timestamp.minute / 60
        phase_shift = 3
        radians = (hour + phase_shift) / 24 * 2 * math.pi
        return math.sin(radians) * spec.circadian_amp

    def _drift(self, scenario: Scenario, metric: str, minutes_elapsed: int) -> float:
        drift_per_hour = scenario.drift_per_hour.get(metric, 0.0)
        return drift_per_hour * (minutes_elapsed / 60)

    def _acute_event_multiplier(self, scenario: Scenario, metric: str, minutes_elapsed: int) -> float:
        if scenario.acute_event_duration_minutes == 0:
            return 1.0
        start = scenario.acute_event_start_minute
        end = start + scenario.acute_event_duration_minutes
        if start <= minutes_elapsed <= end:
            return scenario.acute_event_multiplier.get(metric, 1.0)
        return 1.0

    def generate(self, baseline_profile: Dict, scenario: Scenario, timestamp: datetime, minutes_elapsed: int) -> List[Dict]:
        measurements = []
        for metric, spec in METRICS.items():
            base = baseline_profile.get(metric, {}).get("mean")
            if base is None:
                continue
            std = baseline_profile.get(metric, {}).get("std", 1.0)
            noise = self.random.gauss(0, std)
            circadian = self._circadian(metric, timestamp)
            drift = self._drift(scenario, metric, minutes_elapsed)
            multiplier = self._acute_event_multiplier(scenario, metric, minutes_elapsed)
            value = (base + noise + circadian + drift) * multiplier
            if metric == "activity":
                value = max(0.0, value + self.random.uniform(-500, 500))
            status = "normal"
            if value < spec.normal_low or value > spec.normal_high:
                status = "warning"
            measurements.append(
                {
                    "timestamp": timestamp.isoformat(),
                    "metric": metric,
                    "value": round(value, 2),
                    "unit": spec.unit,
                    "normal_low": spec.normal_low,
                    "normal_high": spec.normal_high,
                    "status": status,
                    "source": "simulator_v1",
                }
            )
        return measurements
