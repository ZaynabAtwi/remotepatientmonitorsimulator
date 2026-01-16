from datetime import datetime
from typing import Dict


FHIR_CODES = {
    "heart_rate": "8867-4",
    "spo2": "59408-5",
    "bp_systolic": "8480-6",
    "bp_diastolic": "8462-4",
    "respiratory_rate": "9279-1",
    "temperature": "8310-5",
    "blood_glucose": "2339-0",
    "activity": "41950-7",
}


def to_fhir_observation(patient_id: str, metric: str, value: float, unit: str, timestamp: datetime) -> Dict:
    return {
        "resourceType": "Observation",
        "status": "final",
        "code": {
            "coding": [{"system": "http://loinc.org", "code": FHIR_CODES.get(metric, "custom")}],
            "text": metric,
        },
        "subject": {"reference": f"Patient/{patient_id}"},
        "effectiveDateTime": timestamp.isoformat(),
        "valueQuantity": {"value": value, "unit": unit},
    }
