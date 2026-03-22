# Cypress (E2E)

## Rules

- Use `data-cy` selectors only.
- Do not use UI login except in `cypress/e2e/auth.cy.ts`.
- Do not use `cy.wait(ms)`.
- Reset the DB using the Cypress task `db:seed` (Django seed).
- Standardize viewport coverage with helpers from
  `cypress/support/e2eTestUtils.ts`.
- Prefer a single shared test flow for desktop/mobile and branch only where
  the UI structure actually differs.
- Prefer `cy.getByCy(...)` over raw `[data-cy="..."]` selectors.
- Use `beforeEach` for test isolation when the spec mutates seeded data.

## Recommended structure

```ts
import {
    DESKTOP_VIEWPORT,
    MOBILE_VIEWPORT,
    describeForViewports,
    visitDashboardAs,
} from "../support/e2eTestUtils";

describe("my spec", () => {
    beforeEach(() => {
        cy.setupDB();
    });

    describeForViewports([DESKTOP_VIEWPORT, MOBILE_VIEWPORT], (viewport) => {
        it("runs the same behavior across viewports", () => {
            visitDashboardAs("admin_user");

            if (viewport.isMobile) {
                cy.getByCy("mobile-layout").should("exist");
                return;
            }

            cy.getByCy("desktop-layout").should("exist");
        });
    });
});
```

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
