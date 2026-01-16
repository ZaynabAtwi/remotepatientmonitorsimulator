# Remote Patient Monitoring (RPM) Simulator

An enterprise-ready, software-only RPM platform simulator designed for clinical demos, education, product validation, and research. It generates synthetic patient vitals with physiologic realism, feeds a backend ingestion pipeline, evaluates clinical rules, and surfaces alerts and analytics in a clinician-grade dashboard.

## 🎥 System Demonstration
[Click here to watch the RPM Simulator demo video](main/RPMS.mp4)

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

## 📁 Repository Structure
``` php
remotepatientmonitorsimulator/
├── backend/
├── docs/
│   ├── architecture.md
│   ├── api_contracts.md
│   ├── fhir_mapping.md
│   └── compliance.md
├── frontend/
├── simulator/
├── README.md
└── docker-compose.yml

``` 

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

## Technical Stack
| Layer                      | Component                    | Technology                       | Purpose                                                                                                                           |
| -------------------------- | ---------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Simulation Layer**       | Physiological Data Generator | Python                           | Generates synthetic, physiologically realistic vital signs with circadian rhythms, noise, trend drift, and acute clinical events. |
| **Simulation Layer**       | Scenario Engine              | Python (Custom Logic)            | Simulates clinical scenarios such as stable patients, gradual deterioration, acute events, and recovery phases.                   |
| **Backend Layer**          | API Framework                | FastAPI (Python)                 | Provides high-performance REST APIs for data ingestion, patient management, alerting, and analytics.                              |
| **Backend Layer**          | Real-Time Streaming          | WebSockets                       | Enables real-time transmission of vitals and alerts to the clinician dashboard.                                                   |
| **Backend Layer**          | Database                     | PostgreSQL                       | Stores structured clinical data including patients, time-series vitals, alerts, and audit logs.                                   |
| **Backend Layer**          | Authentication               | Role-Based Access Control (RBAC) | Supports multiple user roles (admin, clinician, simulator) reflecting real healthcare systems.                                    |
| **Analytics Layer**        | Rules Engine                 | Python (Threshold-Based Logic)   | Evaluates vital signs against clinical thresholds and escalation rules to trigger alerts.                                         |
| **Analytics Layer**        | Anomaly Scoring              | Statistical Analysis (Python)    | Computes basic anomaly and risk scores on time-series data, serving as a foundation for future AI models.                         |
| **Frontend Layer**         | UI Framework                 | React + TypeScript               | Builds a scalable, maintainable, clinician-grade dashboard with strong type safety.                                               |
| **Frontend Layer**         | Data Visualization           | Recharts / Chart.js              | Visualizes real-time and historical vital sign trends in a clinically interpretable format.                                       |
| **Frontend Layer**         | Real-Time Updates            | WebSocket Client                 | Ensures immediate UI updates when patient status or alerts change.                                                                |
| **Deployment Layer**       | Containerization             | Docker & Docker Compose          | Orchestrates backend, frontend, database, and simulator services for consistent deployment.                                       |
| **Interoperability Layer** | Healthcare Standards         | FHIR-Inspired Models             | Aligns simulated clinical data with healthcare interoperability standards for future EHR integration.                             |
| **Compliance Layer**       | Data Privacy                 | Synthetic Data Only              | Ensures ethical use by avoiding real patient data while following HIPAA/GDPR design principles.                                   |


## Compliance Notes
This simulator is designed with HIPAA/GDPR principles in mind but does not store real PHI and is not a certified medical system. Use synthetic data only.

## Contact & Collaboration


    
    👩‍💼 Zaynab Atwi

Biomedical Engineer | BCI Researcher | Founder & CEO – VivoSalus Ventures

🔗 [LinkedIn](https://www.linkedin.com/in/zaynabatwi/)

For partnership inquiries or research collaboration, please contact:

📧 [zaynabatwi.143@gmail.com](zaynabatwi.143@gmail.com)
