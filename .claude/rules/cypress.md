---
paths:
  - "frontend/cypress/**"
---

# Testing with Cypress

## Scope

- Server Components must be tested end-to-end against a live server. Component Testing is retired; write E2E specs.
- Hydration mismatches (Minified React errors #418 and #423) are warnings, not failures; `cypress/support/e2e.ts` ignores them in its `uncaught:exception` handler.

## Selectors and assertions

- Select only by `data-cy` attributes, via `cy.getByCy("...")`. Never by CSS class, ID or tag.
- Add a `data-cy` attribute to every interactive element you introduce.
- Never `cy.wait(<ms>)` after navigation. Assert the URL (`cy.url().should("include", "/dashboard")`) or an element's visibility.
- This app renders desktop and mobile copies of the same DOM. Chain `.filterRendered()` (from `cypress/support/commands.ts`) to pick the rendered copy; `:visible` also drops elements scrolled out of a modal.

## Authentication

- No UI login outside `cypress/e2e/auth.cy.ts`.
- Authenticate with `cy.loginAs("<users.json key>")`. It posts CPF and password to `/api/jwt/create/` and sets the `access` and `refresh` cookies.

## Data

- Never rely on state left by a previous test. Call `cy.setupDB()` in the `beforeEach` of every E2E spec; it runs the `db:seed` task, which resets and reseeds the backend through `django_cypress`.

## Configuration

- `baseUrl` is `http://localhost:3000` (`CYPRESS_BASE_URL` overrides it in the staging stack). Never `cy.visit()` a full URL.
- `frontend/tsconfig.json` excludes `cypress/`, so Next.js type-checking does not see Cypress globals.
- Viewport helpers, the `$body.find` anti-pattern and the recommended spec structure are in `frontend/cypress/README.md`.
