# Security, Privacy, and Compliance Design

## Role-Based Access
- `admin`: manage patients, rules, and users.
- `clinician`: view patients, monitor vitals, acknowledge alerts.

## Audit Logging
- All CRUD actions emit an audit event.
- Includes actor, role, action, patient_id, and timestamp.
- Immutable append-only pattern.

## Data Protection
- TLS required for all connections (placeholder for production).
- Encryption-at-rest supported via PostgreSQL + volume encryption.
- JWT expiration with refresh logic placeholder.

## Compliance Alignment (Design-Level)
- HIPAA: access control, audit logs, minimum necessary access.
- GDPR: data minimization and pseudonymized patient identifiers.
- Data residency: configurable database region.

## Operational Safeguards
- Alert escalation with acknowledgment tracking.
- Traceability for clinical notes and actions.
