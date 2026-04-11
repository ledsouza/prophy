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
│   └── tests/
├── frontend/
│   ├── app/
│   ├── cypress/
│   ├── public/
│   └── styles/
├── pyproject.toml
└── README.md
```

## Local Development Setup

### 1. Install backend dependencies

This project uses Poetry for Python dependency management.

```bash
poetry install
```

### 2. Install frontend dependencies

Inside `frontend/`, install Node dependencies:

```bash
npm install
```

## Environment Variables

The backend reads environment variables from `backend/.env`.
The frontend typically uses `frontend/.env.local`.

### Backend variables

Required or commonly used variables in the current codebase:

| Variable                           | Purpose                                         |
| ---------------------------------- | ----------------------------------------------- |
| `DJANGO_SECRET_KEY`                | Django secret key                               |
| `DEBUG`                            | Enables development behavior when set to `True` |
| `DJANGO_ALLOWED_HOSTS`             | Comma-separated allowed hosts                   |
| `FRONTEND_URL`                     | Frontend URL used by backend integrations       |
| `AUTH_COOKIE_SECURE`               | Controls secure auth cookie behavior            |
| `OIDC_AUDIENCE`                    | Optional audience used by OIDC authentication   |
| `MAILGUN_API_KEY`                  | Mailgun API key                                 |
| `DOMAIN`                           | Mailgun sender domain                           |
| `MAILGUN_API_URL`                  | Optional Mailgun API URL override               |
| `DEFAULT_FROM_EMAIL`               | Default sender email                            |
| `NOTIFICATION_OVERRIDE_RECIPIENTS` | Optional notification override recipients       |

Optional production storage variables:

| Variable                         | Purpose                     |
| -------------------------------- | --------------------------- |
| `GCS_BUCKET_NAME`                | Google Cloud Storage bucket |
| `GCS_PROJECT_ID`                 | Google Cloud project ID     |
| `GOOGLE_APPLICATION_CREDENTIALS` | Service account file path   |

Example `backend/.env`:

```env
DJANGO_SECRET_KEY=change-me
DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
FRONTEND_URL=http://localhost:3000
AUTH_COOKIE_SECURE=False
DEFAULT_FROM_EMAIL=noreply@example.com
MAILGUN_API_KEY=your-mailgun-key
DOMAIN=mg.example.com
```

### Frontend variables

Current frontend environment variables referenced in the codebase:

| Variable                   | Purpose                                    |
| -------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_HOST`         | Backend base host used by the frontend     |
| `NEXT_PUBLIC_APP_VERSION`  | Optional version string for logs           |
| `NEXT_PUBLIC_LOG_LEVEL`    | Client log level                           |
| `NEXT_PUBLIC_LOG_ENDPOINT` | Optional endpoint for shipping client logs |

Example `frontend/.env.local`:

```env
NEXT_PUBLIC_HOST=http://localhost:8000
NEXT_PUBLIC_APP_VERSION=local
NEXT_PUBLIC_LOG_LEVEL=info
```

## Database Setup

The default local database in the current backend settings is SQLite.

Run migrations from `backend/`:

```bash
python manage.py migrate
```

If you need to create new migrations during development:

```bash
python manage.py makemigrations
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

## Running the Application

Run backend and frontend in separate terminals.

### Backend

From `backend/`:

```bash
python manage.py runserver
```

### Frontend

From `frontend/`:

```bash
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/api/docs/`

## Testing

### Backend tests

The backend uses pytest with Django settings configured in `pyproject.toml`.

From the repository root:

```bash
poetry run pytest
```

### Frontend tests

From `frontend/`:

```bash
npm run cypress:open
```

or:

```bash
npm run cypress:run
```

The Cypress configuration uses:

- `baseUrl: http://localhost:3000`
- `apiUrl: http://localhost:8000/api`

It also provides a `db:seed` task that resets and repopulates the backend
through the `django_cypress` integration.

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

Suggested commit message for this documentation update:

```text
docs(readme): update project documentation to match current codebase
```
