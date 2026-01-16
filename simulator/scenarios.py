from dataclasses import dataclass, field
from typing import Dict


@dataclass
class Scenario:
    name: str
    drift_per_hour: Dict[str, float] = field(default_factory=dict)
    acute_event_multiplier: Dict[str, float] = field(default_factory=dict)
    acute_event_start_minute: int = 0
    acute_event_duration_minutes: int = 0


SCENARIOS = {
    "stable": Scenario(name="stable"),
    "gradual_deterioration": Scenario(
        name="gradual_deterioration",
        drift_per_hour={"heart_rate": 0.6, "bp_systolic": 0.8, "spo2": -0.2, "respiratory_rate": 0.3},
    ),
    "sudden_critical": Scenario(
        name="sudden_critical",
        acute_event_multiplier={"heart_rate": 1.3, "spo2": 0.9, "respiratory_rate": 1.2},
        acute_event_start_minute=30,
        acute_event_duration_minutes=15,
    ),
    "recovery": Scenario(
        name="recovery",
        drift_per_hour={"heart_rate": -0.4, "bp_systolic": -0.6, "spo2": 0.2, "respiratory_rate": -0.2},
    ),
}
