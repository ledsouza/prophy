<p align="center">
   <img
      width="150"
      height="150"
      src="frontend/public/images/prophy-icon.png"
      alt="Prophy Logo"
   >
</p>

<h1 align="center">Prophy</h1>

<div align="center">

![Status Badge](https://img.shields.io/badge/Status-Active%20Development-yellow)

</div>

<div align="center">

![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)
![Django REST Framework](https://img.shields.io/badge/Django_REST_Framework-092E20?style=for-the-badge&logo=django&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-593D88?style=for-the-badge&logo=redux&logoColor=white)
![RTK Query](https://img.shields.io/badge/RTK_Query-593D88?style=for-the-badge&logo=redux&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3068B7?style=for-the-badge&logo=zod&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Cypress](https://img.shields.io/badge/Cypress-17202C?style=for-the-badge&logo=cypress&logoColor=white)

</div>

## Overview

Prophy is a web platform for managing medical physics service operations.
It combines a Django REST API with a Next.js frontend to support internal
staff, commercial users, client managers, unit managers, and medical
physicists in their daily workflows.

The repository is organized as a decoupled full-stack application:

- `backend/`: Django + Django REST Framework API
- `frontend/`: Next.js application with TypeScript

## Current Capabilities

The codebase currently implements the following areas.

### Authentication and user management

- JWT login, refresh, verify, and logout flows
- User management endpoints for administrative roles
- Role-aware permissions and association management
- Client/user and unit manager association endpoints
- Support for Google OIDC authentication in the backend

### Client operations and domain data

- Client, unit, and equipment management APIs
- Approval workflow for changes through requisition operations:
    - client operations
    - unit operations
    - equipment operations
- Proposal management and proposal file downloads
- Status endpoints for proposals and clients

### Appointments, service orders, and reports

- Appointment listing, creation, updates, filtering, and access control
- Service order creation and update flows
- Service order PDF generation
- Report creation, listing, retrieval, filtering, and download
- Report soft delete and restore flows
- Scheduled-task trigger endpoints for overdue appointments,
  report notifications, and contract notifications

### Institutional materials

- Institutional material CRUD
- Visibility and permission-based access rules
- Material download endpoint with role-based access control

### Frontend application

- Public landing page and authentication pages
- Role-oriented dashboard structure for:
    - Prophy Manager
    - Commercial
    - Internal Medical Physicist
    - External Medical Physicist
    - Client Manager
    - Unit Manager
- Redux Toolkit + RTK Query for state and API integration
- Form validation with Zod and React Hook Form
- Cypress setup for component and E2E testing
- Client-side structured logging utilities

## Tech Stack

### Backend

- Python 3.12
- Django 5.2
- Django REST Framework
- Djoser
- Simple JWT
- django-filter
- drf-yasg
- pytest, pytest-django, pytest-cov, pytest-xdist, pytest-mock
- factory-boy

### Frontend

- Next.js 16
- React 19
- TypeScript 5
- Redux Toolkit and RTK Query
- Tailwind CSS 4
- Zod
- Cypress

## Architecture Overview

### Backend apps

- `users`: authentication, user profiles, role management,
  and association endpoints
- `clients_management`: clients, units, equipment, accessories,
  appointments, proposals, service orders, and reports
- `requisitions`: approval and workflow entities for changes to
  clients, units, and equipment
- `materials`: institutional materials and permission handling

### Main API entry points

All API routes are served under `/api/`.

- Authentication and users:
    - `/api/jwt/create/`
    - `/api/jwt/refresh/`
    - `/api/jwt/verify/`
    - `/api/logout/`
    - `/api/users/`
    - `/api/users/manage/`
- Client management:
    - `/api/clients/`
    - `/api/units/`
    - `/api/equipments/`
    - `/api/appointments/`
    - `/api/proposals/`
    - `/api/service-orders/`
    - `/api/reports/`
- Requisitions:
    - `/api/clients/operations/`
    - `/api/units/operations/`
    - `/api/equipments/operations/`
- Materials:
    - `/api/materials/`
- API documentation:
    - `/api/docs/`

## Repository Structure

```text
.
├── backend/
│   ├── clients_management/
│   ├── core/
│   ├── materials/
│   ├── requisitions/
│   ├── users/
│   ├── tests/
│   ├── pyproject.toml
│   └── poetry.lock
├── frontend/
│   ├── app/
│   ├── cypress/
│   ├── public/
│   └── styles/
└── README.md
```

## Prerequisites

- Python 3.12+
- [Poetry](https://python-poetry.org/) for Python dependency management
- Node.js 20+ and npm

## Local Development Setup

### 1. Configure environment variables

Copy the examples below into the appropriate files.

`backend/.env`:

```env
DJANGO_SECRET_KEY=change-me
DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
FRONTEND_URL=http://localhost:3000
AUTH_COOKIE_SECURE=False
DEFAULT_FROM_EMAIL=noreply@example.com
```

`frontend/.env.local`:

```env
NEXT_PUBLIC_HOST=http://localhost:8000
NEXT_PUBLIC_APP_VERSION=local
NEXT_PUBLIC_LOG_LEVEL=info
```

### 2. Install dependencies

```bash
# Backend (from backend/)
poetry install

# Frontend (from frontend/)
npm install
```

Poetry creates an isolated virtual environment for the backend.
Prefix every backend command with `poetry run` so it always uses the
correct environment, regardless of what is active in your shell.

### 3. Set up the database

```bash
# From backend/
poetry run python manage.py migrate
```

To seed the database with sample data:

```bash
# From backend/
./flush_and_populate_db.sh
```

### 4. Run the development servers

Open two terminals.

```bash
# Terminal 1 — backend (from backend/)
poetry run python manage.py runserver

# Terminal 2 — frontend (from frontend/)
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/api/docs/`

## Environment Variables

The backend reads environment variables from `backend/.env`.
The frontend typically uses `frontend/.env.local`.

Copy the committed example files to get started:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Each file is fully annotated — fill in the values appropriate for
your environment. See the example files for the complete list of
variables and their purpose.

### Backend variables

`backend/.env.example` documents every variable. Key groups:

| Variable                           | Notes                                             |
| ---------------------------------- | ------------------------------------------------- |
| `DJANGO_SECRET_KEY`                | Required. Generate a fresh value for production.  |
| `DEBUG`                            | `True` locally, `False` in all other envs.        |
| `DJANGO_ALLOWED_HOSTS`             | Comma-separated; required in production.          |
| `CSRF_TRUSTED_ORIGINS`             | Required in production.                           |
| `CORS_ALLOWED_ORIGINS`             | Required in production.                           |
| `MAILGUN_API_KEY`                  | Rotate before first production deploy.            |
| `GCS_BUCKET_NAME`                  | Required when using `core.settings.prod`.         |
| `DATABASE_ENGINE`                  | `sqlite` (default) or `postgres`.                 |

In production, sensitive values (`DJANGO_SECRET_KEY`, `POSTGRES_PASSWORD`,
`MAILGUN_API_KEY`) are injected at runtime via Google Cloud Secret Manager
rather than stored in a file. The example file marks which variables follow
this pattern.

### Frontend variables

`frontend/.env.example` documents every variable:

| Variable                   | Purpose                                    |
| -------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_HOST`         | Backend base URL used by the frontend.     |
| `NEXT_PUBLIC_APP_VERSION`  | Optional version string for log metadata.  |
| `NEXT_PUBLIC_LOG_LEVEL`    | Client log level (default: `info`).        |
| `NEXT_PUBLIC_LOG_ENDPOINT` | Optional endpoint for shipping client logs.|

## Database Setup

The default local database in the current backend settings is SQLite.

The backend is now prepared for two database modes:

- development default: SQLite
- production target: PostgreSQL / Cloud SQL

You can keep using SQLite locally. For PostgreSQL-based environments,
configure one of the following:

- `DATABASE_ENGINE=postgres` with `DATABASE_URL`
- `DATABASE_ENGINE=postgres` with `POSTGRES_DB`, `POSTGRES_USER`,
  `POSTGRES_PASSWORD`, `POSTGRES_HOST`, and `POSTGRES_PORT`

Run migrations from `backend/`:

```bash
poetry run python manage.py migrate
```

If you need to create new migrations during development:

```bash
poetry run python manage.py makemigrations
```

## Seed and Reset Flow

The repository includes `backend/flush_and_populate_db.sh`, which:

1. flushes the database
2. cleans local media files
3. runs the `populate` management command

From `backend/`:

```bash
./flush_and_populate_db.sh
```

## Staging Environment

The staging stack builds fully self-contained images and wires up Postgres,
Nginx, and Cypress. Use it to validate E2E flows before shipping — not for
active feature development.

```bash
# From repo root
docker compose -f docker-compose.yml -f docker-compose.staging.yml up --build
```

Or via the frontend npm script:

```bash
# From frontend/
npm run e2e:docker
```

The staging stack runs:

- `backend` — `staging` image target behind Gunicorn/Uvicorn on port 8080
- `frontend` — `staging` image target on port 8080
- `proxy` — Nginx (`infra/nginx/app.conf`) on port 8080
- `postgres` — PostgreSQL 16 on port 5432
- `cypress` — headless Cypress run against the proxy
- `backend-tests` — pytest run inside the staging backend image

Ports exposed to the host:

| Service | Host port |
| ------- | --------- |
| proxy | 8080 |
| backend | 8000 |
| frontend | 3000 |
| postgres | 5432 |

## Production Image Strategy

The production deployment target is Cloud Run with separate frontend and
backend services.

### Backend production image

Build the backend production image from the `prod` target:

```bash
docker build -f backend/Dockerfile --target prod -t prophy-backend:prod .
```

This image is intended to run the Django application in production.

### Frontend production image

Build the frontend production image from the `prod` target:

```bash
docker build -f frontend/Dockerfile --target prod -t prophy-frontend:prod .
```

This image is intended to run the Next.js application in production.

### Cloud Run target architecture

Recommended production topology:

- one Cloud Run service for the Django backend
- one Cloud Run service for the Next.js frontend
- Cloud SQL for the production database
- GCS for production object storage where applicable

## Testing

### Backend tests

Run natively against your local SQLite database — no Docker needed.

From `backend/`:

```bash
poetry run pytest
```

### Frontend E2E tests (Cypress)

Two modes:

**Local** — run against locally running servers (fastest iteration):

```bash
# Requires both servers already running on :3000 and :8000
npm run cypress:open   # interactive UI
npm run cypress:run    # headless
```

**Staging** — run against fully-built Docker images (CI parity):

```bash
npm run e2e:docker
```

The `db:seed` Cypress task resets and repopulates the backend through the
`django_cypress` integration before each E2E spec.

## API Documentation

Swagger UI is available at:

```text
/api/docs/
```

This route is configured with `drf-yasg` in `backend/core/urls.py`.

## Contributing

If you want to contribute:

1. fork the repository
2. create a feature branch
3. open a pull request targeting `main`
