# FHIR Mapping (Design)

## Observation Resource
Each vital sign maps to a FHIR `Observation` with:
- `subject`: Patient reference
- `effectiveDateTime`: measurement timestamp
- `valueQuantity`: value + unit
- `code`: LOINC code placeholder

| Metric | Unit | FHIR Code (LOINC placeholder) |
|---|---|---|
| Heart Rate | bpm | 8867-4 |
| SpO₂ | % | 59408-5 |
| Blood Pressure (Systolic) | mmHg | 8480-6 |
| Blood Pressure (Diastolic) | mmHg | 8462-4 |
| Respiratory Rate | rpm | 9279-1 |
| Body Temperature | °C | 8310-5 |
| Blood Glucose | mg/dL | 2339-0 |
| Activity (Steps) | steps | 41950-7 |

## Patient Resource
- `identifier`: simulator patient id
- `name`: synthetic name
- `gender`, `birthDate`

## Alert Mapping (Non-FHIR)
Alerts remain a system-specific resource but can be represented as:
- `DetectedIssue` or `Flag` for clinical risk signaling.
