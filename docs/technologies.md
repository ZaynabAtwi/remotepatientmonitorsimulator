# Technology Stack

This document summarizes the technologies used across the RPM simulator stack.

## Backend (API, Rules, Analytics)
- **Python 3.11** for backend services and simulation logic.
- **FastAPI** for REST APIs and WebSocket streaming.
- **Uvicorn** ASGI server for FastAPI.
- **SQLAlchemy** ORM for database access.
- **PostgreSQL** as the primary database (time-series indexing with composite indexes).
- **JWT (python-jose)** for authentication.
- **Passlib (bcrypt)** for password hashing.
- **Pydantic** for request/response validation.

## Simulation Engine
- **Python** modules in `simulator/` for physiological modeling.
- **httpx** for HTTP ingestion into the backend API.

## Frontend (Clinician Dashboard)
- **React 18** + **TypeScript** for UI and state management.
- **Vite** for frontend bundling and dev server.
- **Tailwind CSS** for styling and layout.
- **Recharts** for time-series visualization.
- **clsx** for conditional class composition.

## Infrastructure & Local Dev
- **Docker** + **Docker Compose** for local orchestration.
- **Node.js 20** (via container) for frontend runtime.

## Documentation & Design Artifacts
- Architecture, API contracts, FHIR mapping, and compliance docs in `docs/`.
