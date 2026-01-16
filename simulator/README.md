# RPM Simulation Engine

## Overview
Generates synthetic physiological time-series data with circadian rhythms, drift, and acute events. Designed to feed the backend ingestion API.

## Scenarios
- `stable`: baseline fluctuations only
- `gradual_deterioration`: slow worsening trends
- `sudden_critical`: short acute event window
- `recovery`: improving trends

## Run
```
python -m simulator.run_simulator --base-url http://localhost:8000 --scenario gradual_deterioration
```

## Notes
- Uses seed patients from `backend/data/seed_patients.json`.
- Adjustable frequency and duration for demo or research.
- Manual event injection example:
  ```
  python -m simulator.run_simulator --scenario stable --event heart_rate=1.4,spo2=0.88 --event-start-minute 15 --event-duration-minutes 8
  ```
