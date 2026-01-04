# Cypress (E2E)

## Rules

- Use `data-cy` selectors only.
- Do not use UI login except in `cypress/e2e/auth.cy.ts`.
- Do not use `cy.wait(ms)`.
- Reset the DB using the Cypress task `db:seed` (Django seed).

## Local run

1. Start backend (Django) on `:8000` with `django_cypress` routes enabled.
2. Start frontend (Next) on `:3000`.
3. From `frontend/`:

```bash
npm run cypress:open
```

Headless:

```bash
npm run cypress:run
```

CI-style (assumes Next already built):

```bash
npm run e2e:ci
```
