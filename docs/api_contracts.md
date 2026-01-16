# API Contracts (v1)

Base URL: `/api/v1`

Authentication: Bearer JWT with role claim (`admin` or `clinician`).

## Auth
### POST `/auth/login`
Request
```
{ "username": "clinician1", "password": "demo123" }
```
Response
```
{ "access_token": "<jwt>", "token_type": "bearer", "role": "clinician" }
```

## Patients
### GET `/patients`
Query: `status`, `risk_profile`, `assigned_clinician`

Response
```
[
  {
    "id": "pat_001",
    "name": "Avery Kim",
    "age": 62,
    "sex": "female",
    "height_cm": 165,
    "weight_kg": 74,
    "diagnoses": ["Hypertension", "Type 2 Diabetes"],
    "risk_profile": "high",
    "assigned_clinician": "dr.santos",
    "monitoring_status": "active"
  }
]
```

### POST `/patients`
Creates a patient profile.

### GET `/patients/{patient_id}`
Full patient details.

## Vitals
### POST `/vitals/ingest`
Request
```
{
  "patient_id": "pat_001",
  "measurements": [
    {
      "timestamp": "2026-01-16T10:15:00Z",
      "metric": "heart_rate",
      "value": 88,
      "unit": "bpm",
      "normal_low": 60,
      "normal_high": 100,
      "status": "normal",
      "source": "simulator_v1"
    }
  ]
}
```
Response
```
{ "ingested": 1, "alerts_generated": 0 }
```

### GET `/vitals/{patient_id}`
Query: `metric`, `start`, `end`, `limit`

## Alerts
### GET `/alerts`
Query: `patient_id`, `severity`, `acknowledged`

### POST `/alerts/{alert_id}/acknowledge`
Request
```
{ "clinician_note": "Reviewed, adjusting meds." }
```

## Analytics
### GET `/analytics/summary`
Response
```
{
  "patient_id": "pat_001",
  "risk_score": 0.72,
  "trend": "deteriorating",
  "metrics": {
    "heart_rate": { "avg": 92, "max": 118 },
    "spo2": { "avg": 95, "min": 89 }
  }
}
```

## WebSocket
### GET `/ws/stream?token=<jwt>`
Server push events:
```
{ "type": "vital", "payload": { ... } }
{ "type": "alert", "payload": { ... } }
{ "type": "audit", "payload": { ... } }
```
