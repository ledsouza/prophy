# Cypress (E2E)

## Rules

- Use `data-cy` selectors only.
- Do not use UI login except in `cypress/e2e/auth.cy.ts`.
- Do not use `cy.wait(ms)`.
- Reset the DB using the Cypress task `db:seed` (Django seed).
- Standardize viewport coverage with helpers from
  `cypress/support/e2eTestUtils.ts`.
- Responsive suites must always be labeled only as `viewport desktop` and
  `viewport mobile`.
- Prefer a single shared test flow for desktop/mobile and branch only where
  the UI structure actually differs.
- Prefer `cy.getByCy(...)` over raw `[data-cy="..."]` selectors.
- Use `beforeEach` for test isolation when the spec mutates seeded data.
- Never use synchronous DOM snapshots such as `$body.find(...)` inside
  `.then(...)` to decide whether async content exists.
- For async UI states, prefer retryable Cypress assertions like
  `cy.get(...).should(...)` so the test waits for the rendered state.

## Async rendering and responsive assertions

When testing responsive pages, avoid one-shot checks that inspect the DOM
before the API response has finished rendering the final UI.

Bad pattern:

```ts
cy.get("body").then(($body) => {
    const cards = $body.find('[data-cy^="material-card-"]');

    if (cards.length > 0) {
        cy.get('[data-cy^="material-card-"]')
            .first()
            .should("be.visible");
        return;
    }

    cy.contains("Nenhum material encontrado").should("be.visible");
});
```

Why this is unsafe:

- `$body.find(...)` is a one-time jQuery lookup.
- Cypress does not retry that lookup.
- The branch decision can happen before the request resolves, creating
  flaky tests.

Preferred pattern:

```ts
cy.get('[data-cy^="material-card-"]', { timeout: 10000 })
    .should("have.length.greaterThan", 0)
    .first()
    .should("be.visible");
```

If the page can legitimately end in multiple stable states, wait for a
retryable signal that represents one of those completed states instead of
branching from a synchronous snapshot.

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
