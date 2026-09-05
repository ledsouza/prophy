<!-- bmad:context -->
<!-- Verified 2026-09-05 against 55e0006. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## prophy

Web platform for medical physics service operations. Django REST API in `backend/` (Python 3.12, Poetry), Next.js 16 / React 19 / TypeScript app in `frontend/` (Node 22, npm). Two Cloud Run services in GCP project `prophy-497315`, region `southamerica-east1`; runbook, rollback and env-var reference in `docs/deployment.md`. Topic rules in `.claude/rules/` load by path.

## Policy

- Solo project: commit to `main`; no feature branches or PRs. Propose a Conventional Commits message (`type(scope): imperative summary`) and let the user run `git commit`.
- Never start the dev servers or the app; the user runs them.
- Never edit `backend/pyproject.toml` dependencies by hand; use `poetry add` / `poetry remove` (`--group dev` for dev deps).
- `backend/flush_and_populate_db.sh` destroys all data; local SQLite and the staging stack only, never Cloud SQL.
- Production secrets come from Secret Manager; never write secret values into workflows, Terraform, docs or logs.
- Write docs and comments for someone who has never seen this repo: no issue/PR numbers, no commit hashes, no "already set" framing; expand acronyms on first use.
- Move a GitHub issue to Done only when every acceptance criterion is met; otherwise leave it In Progress and comment what is outstanding.
- Load the user-level `python-standards` skill before any Python work and `typescript-standards` before any TS/React work; neither lives in this repo.

## Where things are

- Backend apps: `users` (CPF-login user model, roles, JWT, Google OIDC), `clients_management` (clients, units, equipment, appointments, proposals, service orders, reports), `requisitions` (add/edit/delete approval workflow), `materials`, `core` (settings, URL root, pagination). API under `/api/`, Swagger at `/api/docs/`.
- Roles in `UserAccount.Role`: `GP` Prophy manager, `FMI`/`FME` internal/external medical physicist, `GGC` client general manager, `GU` unit manager, `C` commercial, `SA` service account.
- Settings in `core/settings/`: `base.py` reads `backend/.env`; `dev.py` is the `manage.py` default; `test.py` forces `db_test.sqlite3`; `prod.py`, `staging.py`, `build.py` (collectstatic), `migrate.py`.
- Frontend data: one RTK Query base in `app/redux/services/apiSlice.ts` (JWT refresh with a mutex); feature endpoints go through `apiSlice.injectEndpoints()` in per-feature `*ApiSlice.ts` files, never into the base slice. Payload types in `app/redux/types/`.
- Dashboard is Next.js parallel routes, one `@slot` per role, selected in `app/dashboard/layout.tsx`.
- Cypress conventions and lessons: `frontend/cypress/README.md`. Full E2E procedure: `/e2e` (`.claude/commands/e2e.md`).
- Infra is Terraform in `infra/terraform/`; deploys are GitHub Actions with Workload Identity Federation in `.github/workflows/`.

## Running and verifying

- Prefix every backend command with `poetry run` from `backend/`; never `poetry shell`.
- Backend CI runs `ruff check .`, `ruff format --check .`, `mypy .`, then `pytest`; run all four before calling backend work done, pytest alone misses CI failures.
- `pytest` always uses `core.settings.test` with coverage on; add `--no-cov` when iterating on one file (`-p no:cov` errors against the `addopts`).
- Frontend CI runs `npm run lint` then `npm run build`; the build is the typecheck, there is no separate `tsc` step.
- Cypress E2E is a required verification step for every feature. Run it from the repo root: `docker compose -f docker-compose.yml -f docker-compose.staging.yml up --build --abort-on-container-exit --exit-code-from cypress`, never `npm run e2e:docker`.
- A full E2E run takes about 8 minutes. After a fix, re-run only the failing spec with `docker compose -f docker-compose.yml -f docker-compose.staging.yml run --rm cypress npx cypress run --spec "frontend/cypress/e2e/<spec>.cy.ts"`, then the full suite once. For a narrow follow-up after a full pass (styling, copy), run only the affected specs.
- The Cypress image copies `frontend/cypress` at build time; if a spec or support file changed, rebuild `cypress` (or use `up --build`) before trusting a "still failing" result.
- Docker Desktop's VM disk fills silently while host `df` looks fine; check with `docker run --rm alpine df -h /` and prune with `docker builder prune -a -f && docker system prune -f --volumes` before a build.
- Cypress Component Testing (`frontend/cypress/component/`) is retired; write E2E specs instead.

## Conventions that differ from defaults

- Python: `list[str]` and `str | None`, no `Any`; `match/case` over `if/elif` chains on one value; no imports inside functions; explicit `is None` / emptiness checks, not bare truthiness; lazy `%s` args in log calls and `logger.exception()` inside `except`.
- Backend tests: pytest functions only with `@pytest.mark.django_db`, Arrange-Act-Assert, `factory_boy` factories in `backend/tests/factories/`, `force_authenticate`, `rest_framework.status` constants, patch at the point of use. Unit tests in each app's `tests/`, cross-app tests in `backend/tests/`.
- Comments: none by default, only the why, split across lines; a named constant instead of an explained magic number; commented-out code older than a week is deleted.
- TypeScript: `type` over `interface` for payloads; every form is Zod plus React Hook Form via `zodResolver`; JSDoc describes params without repeating types; check `styles/globals.css`, `tailwind.config.ts` and `app/components/` for an existing token or component before adding one.
- Icons come from `@phosphor-icons/react` with `Icon`-suffixed names (`ArrowClockwiseIcon`). `@heroicons` and `react-icons` remain in four legacy files awaiting migration; do not add new uses.
- Logging: `app/utils/logger.ts` (Pino) with `child()` for scope; never `console.*`; never log tokens, cookies or personal data.
- Tailwind v4 spacing is computed: use scale classes (`h-50`) rather than `h-[200px]` whenever px/4 is a whole number.
- Cypress: `data-cy` selectors only (`cy.getByCy`), `cy.setupDB()` in every `beforeEach`, `cy.loginAs("<fixture>")` for auth (it posts to `/api/jwt/create/`), no `cy.wait(ms)`, no UI login outside `auth.cy.ts`.
- Security: no `pickle`, `eval`/`exec`, `os.system`/`subprocess`, `random` for secrets, `hashlib` for passwords, or raw SQL; use `json`, `secrets`, Django hashers and the ORM.

## Known pitfalls

- A date-only string (`YYYY-MM-DD`) passed to `new Date()` parses as UTC and shows the previous day in `America/Sao_Paulo`; use `parseISO` from date-fns (see `formatDate` in `app/utils/format.ts`). Fixed twice already.
- Components render desktop and mobile copies of the same DOM (`hidden sm:block` / `sm:hidden`); in Cypress chain `.filterRendered()` from `cypress/support/commands.ts`, never `:visible`, which also drops elements scrolled out of a modal.
- `NEXT_PUBLIC_HOST` is baked into the frontend bundle at image build (`--build-arg`); a runtime `environment:` entry has no effect. Rebuild the image when the backend URL changes.
- Cloud Run reserves `PORT`; never set it in `gcloud run deploy`. Comma-containing `--set-env-vars` values need the `^|^` delimiter. Images must be built `--platform linux/amd64`.

<!-- /bmad:context -->
