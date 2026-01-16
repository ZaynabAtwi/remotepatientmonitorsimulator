# Remote Patient Monitoring (RPM) Simulator

An enterprise-ready, software-only RPM platform simulator designed for clinical demos, education, product validation, and research. It generates synthetic patient vitals with physiologic realism, feeds a backend ingestion pipeline, evaluates clinical rules, and surfaces alerts and analytics in a clinician-grade dashboard.

## System Overview
**Core flow**
1. Synthetic patient profiles are created with risk, diagnoses, and baselines.
2. Simulation engine generates time-series vitals (circadian rhythms, noise, drift, events).
3. Backend ingests and validates data, stores it, triggers alerts, and logs actions.
4. Clinicians monitor trends in real time and acknowledge alerts.

Reference architecture and API contracts:
- `docs/architecture.md`
- `docs/api_contracts.md`
- `docs/fhir_mapping.md`
- `docs/compliance.md`

## Data Model (Clinical)
**Patient**
- `id`, `name`, `age`, `sex`, `height_cm`, `weight_kg`
- `diagnoses`, `risk_profile`, `assigned_clinician`
- `monitoring_status`, `baseline_profile`

**Vital (time-series)**
- `timestamp`, `metric`, `value`, `unit`
- `normal_low`, `normal_high`, `status`
- `source`

**Alert**
- `id`, `patient_id`, `metric`, `severity`
- `trigger_rule`, `timestamp`, `acknowledged`, `clinician_notes`

## Backend (FastAPI)
Located in `backend/`

Capabilities:
- Patient lifecycle management
- Vitals ingestion + validation
- Rules-based alerting and escalation
- Analytics + anomaly score
- Audit logging
- WebSocket realtime feed

### Run (Local)
```
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Environment variables:
- `DATABASE_URL` (PostgreSQL)
- `SECRET_KEY`
- `CORS_ORIGINS`

### Seeded Users
- `admin` / `admin123`
- `clinician1` / `demo123`
- `simulator` / `simulator123`

## Simulation Engine
Located in `simulator/`

Features:
- Circadian rhythm modulation
- Trend drift for deterioration/recovery
- Acute event injection
- Adjustable sampling frequency

Run:
```
python -m simulator.run_simulator --scenario gradual_deterioration
```

## Frontend (React + TypeScript)
Located in `frontend/`

Features:
- Patient list with status indicators
- Real-time vitals cards
- Trend charts
- Alert panel with acknowledgment
- Patient detail + risk metrics

Run:
```
cd frontend
npm install
npm run dev
```

Set API base URL:
```
VITE_API_URL=http://localhost:8000
```

## Docker Compose
```
docker compose up --build
```

## Extensibility
- Add new vitals in `simulator/generator.py` and `backend/services/rules_engine.py`.
- Add new rules in `backend/services/rules_engine.py` or via DB in `rule_definitions`.
- Extend analytics in `backend/services/analytics.py`.
- Add FHIR export endpoints using `backend/services/fhir_mapper.py`.

## Compliance Notes
This simulator is designed with HIPAA/GDPR principles in mind but does not store real PHI and is not a certified medical system. Use synthetic data only.