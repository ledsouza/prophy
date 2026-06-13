# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Detailed rules live in `.claude/rules/` — consult those files for extended guidance on specific topics.

## Production

Both services are live on GCP Cloud Run (project `prophy-497315`, region `southamerica-east1`):

| Service | URL |
|---------|-----|
| Backend (Django) | `https://prophy-backend-341810477176.southamerica-east1.run.app` |
| Frontend (Next.js) | `https://prophy-frontend-341810477176.southamerica-east1.run.app` |

Infrastructure is Terraform-managed (`infra/terraform/`). CI/CD runs via GitHub Actions with Workload Identity Federation — no long-lived keys. See `docs/deployment.md` for the full runbook, env var reference, rollback procedure, and custom domain migration steps.

**Open items:**
- `#211` — Custom domains (`api.prophy.com` / `app.prophy.com`) blocked on stakeholder DNS configuration.
- `#214` — Remaining smoke tests (file upload, scheduled task, Mailgun) deferred until stakeholder populates data.

## Behavioral directives

- **Analyze before implementing.** Read existing patterns, components, and utilities before writing new code. Match the established style of the surrounding code.
- **Do not run the application.** The user is responsible for running the dev server.
- **Ask when ambiguous.** If a request is unclear or could be improved, raise it rather than guessing.
- **Never edit `pyproject.toml` directly.** Always use the Poetry CLI (`poetry add`, `poetry remove`) to manage backend dependencies.

## Commands

### Backend (run from `backend/`)

```bash
poetry install                    # install dependencies
python manage.py migrate          # apply migrations
python manage.py makemigrations   # create new migrations
python manage.py runserver        # start dev server on :8000
./flush_and_populate_db.sh        # flush DB, clean media, reseed
```

### Backend tests (run from `backend/`)

```bash
poetry run pytest                                      # all tests
poetry run pytest path/to/test.py::test_function_name  # single test
poetry run pytest -k "keyword"                         # filter by name
poetry run pytest -x                                   # stop on first failure
```

### Frontend (run from `frontend/`)

```bash
npm install           # install dependencies
npm run dev           # start dev server on :3000 (Turbopack)
npm run build         # production build
npm run lint          # ESLint
npm run cypress:open  # interactive Cypress UI
npm run cypress:run   # headless Cypress
```

### Staging environment (run from repo root)

Used for E2E testing with fully-built images — not for active development.

```bash
# Full staging stack — Postgres + Nginx proxy + Cypress
docker compose -f docker-compose.yml -f docker-compose.staging.yml up --build

# Or via the frontend npm script
npm run e2e:docker   # (from frontend/)
```

## Architecture

### Backend apps

| App | Responsibility |
|-----|----------------|
| `users` | Custom user model (CPF-based login), roles, JWT auth, Google OIDC, associations |
| `clients_management` | Clients, units, equipment, appointments, proposals, service orders, reports |
| `requisitions` | Approval workflow (Add/Edit/Delete operations) for clients, units, equipment |
| `materials` | Institutional materials with role-based access |
| `core` | Settings, URL root, pagination, validators |

All API routes are served under `/api/`. Swagger UI is at `/api/docs/`.

### User roles

The `UserAccount` model uses CPF (not username) as the primary identifier. Roles (`UserAccount.Role`):

| Code | Constant |
|------|----------|
| `GP` | `PROPHY_MANAGER` |
| `FMI` | `INTERNAL_MEDICAL_PHYSICIST` |
| `FME` | `EXTERNAL_MEDICAL_PHYSICIST` |
| `GGC` | `CLIENT_GENERAL_MANAGER` |
| `GU` | `UNIT_MANAGER` |
| `C` | `COMMERCIAL` |
| `SA` | `SERVICE_ACCOUNT` |

### Backend settings

Settings are split in `core/settings/`:
- `base.py` — shared config, reads from `backend/.env`
- `test.py` — pytest overrides (SQLite test DB, MD5 password hasher, `ENABLE_CYPRESS_ROUTES=True`)

Pytest always uses `core.settings.test` (set in `pyproject.toml`).

Database: SQLite by default; switch to Postgres by setting `DATABASE_ENGINE=postgres` with `DATABASE_URL` or individual `POSTGRES_*` vars.

### Frontend state management

Redux store (`app/redux/store.ts`):

- `apiSlice` — single RTK Query base slice. Feature endpoints are **injected** via `apiSlice.injectEndpoints()` in per-feature `*ApiSlice.ts` files. Never add endpoints directly to `apiSlice`.
- `ibgeApiSlice` — separate slice for the external IBGE API
- `authSlice` — boolean auth state (JWT stored in HTTPOnly cookies)
- `modalSlice` — shared modal visibility state

The `apiSlice` base query handles JWT refresh automatically with a mutex (`app/redux/services/apiSlice.ts`): on 401, refreshes once, retries, then dispatches `logout` on failure.

### Frontend routing

`app/dashboard/` uses Next.js parallel routes, one slot per role:

```
app/dashboard/
  @prophyManager/
  @commercial/
  @externalMedicalPhysicist/
  @internalMedicalPhysicist/
  @clientManager/
  @unitManager/
  layout.tsx   ← selects slot based on user role
```

## Testing conventions

### Backend

See `.claude/rules/django-testing.md` for the full ruleset. Key points:

- `pytest` functions only — no `unittest.TestCase`. Mark DB access with `@pytest.mark.django_db`.
- Follow **Arrange–Act–Assert** in every test function.
- Use `factory_boy` for test data (factories in `tests/factories/`). No Django JSON fixtures.
- Authenticate with `api_client.force_authenticate(user=user)` — never POST credentials.
- Assert status codes with `rest_framework.status` constants, not magic numbers.
- Directory convention: unit tests in the app's own `tests/` folder; integration tests in the top-level `tests/` directory.
- Patch at the point of **use**: `myapp.views.send_email`, not `myapp.services.send_email`.

### Frontend (Cypress)

See `.claude/rules/cypress.md` for the full ruleset. Key points:

- Select elements only via `data-cy="..."` attributes — never by CSS class, ID, or tag.
- Call `cy.setupDB()` in `beforeEach` for every E2E spec.
- Authenticate programmatically with `cy.loginAs("admin_user")` — no UI login except in the dedicated auth spec.
- Never `cy.wait(<ms>)` after navigation — assert on URL or element visibility instead.
- Server Components (RSC) must be tested via E2E against a live server, not Component Testing.

## Code conventions

### Python

See `.claude/rules/python_format_style.md` and `.claude/rules/soft_rules.md` for full detail.

- **Line length**: 79 chars for code, 72 for docstrings/comments (`ruff` enforces this).
- **Imports**: no wildcard imports. Use explicit names.
- **Truthiness**: always explicit — `if x is not None:`, not `if x:`.
- **No global mutable state**. Pass state via arguments or class instances.
- **Context managers**: always use `with` for files, DB connections, and other resources.
- **Type hints**: use built-in generics (`list[str]`, `dict[str, int]`), not `typing.List`/`typing.Dict`. Use `str | None` not `Optional[str]`. Avoid `Any`; prefer `TypedDict` or Pydantic models.
- **Structural pattern matching**: `match/case` is preferred over chains of `isinstance` checks or `if/elif` dispatching. See `.claude/rules/structural_pattern_matching.md`.
- **Logging**: `logger = logging.getLogger(__name__)` per module. Use `logger.exception()` inside `except` blocks to capture tracebacks. Never log secrets, tokens, or PII.

### TypeScript / Next.js

See `.claude/rules/typescript_payload_types.md` for full detail.

- **API types**: prefer `type` over `interface` for payload shapes. Use `Partial<T>` for PATCH payloads. Define types in `app/redux/types/`, not inline.
- **Forms**: always use Zod schemas paired with React Hook Form. Never build forms without schema validation.
- **Icons**: use `@phosphor-icons/react`. Component names end in `Icon` (e.g., `ArrowClockwiseIcon`).
- **UI consistency**: before adding new styles, check `styles/globals.css` and `tailwind.config.ts` for existing design tokens. Before using a library component, check if an equivalent already exists in `app/components/`.
- **Logging**: use the Pino-based logger (`app/utils/logger.ts`), not `console.*` directly. Use `child()` for scoped loggers. Never log tokens, cookies, or personal data. See `.claude/rules/logging_nextjs.md`.

### Comments (all languages)

See `.claude/rules/comments.md` for the full ruleset. Summary:

- Default position: **no comments**. Self-documenting code is always preferred.
- Only comment the **why** — never the what.
- Break comments across multiple lines; no single long comment lines.
- Delete commented-out code that has existed for more than one week. Retrieve it from git if needed.
- Replace magic numbers with named constants instead of explaining them in comments.

### Git

- Commits follow **Conventional Commits**; releases follow **SemVer**. See `.claude/rules/git.md`.
- Solo project — commit directly to `main`. No feature branches or PRs.

## Environment variables

**`backend/.env`**:

```
DJANGO_SECRET_KEY=...
DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
FRONTEND_URL=http://localhost:3000
AUTH_COOKIE_SECURE=False
DEFAULT_FROM_EMAIL=noreply@example.com
MAILGUN_API_KEY=...
DOMAIN=mg.example.com
```

**`frontend/.env.local`**:

```
NEXT_PUBLIC_HOST=http://localhost:8000
NEXT_PUBLIC_APP_VERSION=local
NEXT_PUBLIC_LOG_LEVEL=info
```
