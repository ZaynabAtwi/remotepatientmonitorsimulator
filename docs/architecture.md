# Remote Patient Monitoring (RPM) Simulator Architecture

## Goals
- Clinically realistic simulation with configurable patient scenarios.
- Modular, scalable components with clear interfaces.
- Enterprise-ready design with audit, security, and compliance controls.
- Real-time clinician monitoring with alert escalation.

## High-Level Flow
1. Synthetic patient profiles and conditions are defined.
2. Simulation engine generates time-series vitals with circadian rhythms, drift, and acute events.
3. Data is sent via REST ingestion to the backend.
4. Backend validates, stores, and runs rules + analytics.
5. Alerts and updates are pushed over WebSockets to the clinician dashboard.
6. Clinicians acknowledge alerts, add notes, and review trends.

```
Simulated Patients
     │
     ▼
Simulation Engine ──► Ingestion API ──► Time-Series Store (PostgreSQL)
     │                                  │
     └──────────► Audit Log             ├─► Rules + Alert Engine
                                        ├─► Analytics + Risk Scoring
                                        └─► WebSocket Event Stream
                                                          │
                                                          ▼
                                             Clinician Dashboard
```

## Components

### Backend (FastAPI)
- REST API for patients, vitals ingestion, alerts, analytics.
- WebSocket stream for real-time monitoring events.
- Rules engine for single-metric and multi-metric thresholds.
- Audit logging for user actions and system events.

### Simulation Engine (Python)
- Physiological model with circadian rhythm + noise.
- Scenario injection (stable, deterioration, critical, recovery).
- Manual abnormal events for demos.

### Frontend (React + TypeScript)
- Clinician dashboard with patient list and status indicators.
- Real-time vitals cards and alert center.
- Trend charts with time-series history.
- Patient detail view with timeline and notes.

## Data Stores
- PostgreSQL (time-series table with indexes for patient/time).
- Auditable alert records with clinician acknowledgment.

## Interoperability
- FHIR-ready mapping for vital signs to Observation resources.
- Standard units and code system placeholders.

## Security + Compliance
- Role-based access (admin, clinician).
- JWT auth flow for APIs and WebSockets.
- Audit log of read/write events.
- Encryption placeholders for PHI at rest and in transit.
