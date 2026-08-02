# Testing with Cypress

## Testing Philosophy & Scope

-   Pyramid Inversion: Do not attempt to test Server Components (RSC) using Component Testing (CT). RSCs must be tested via End-to-End (E2E) tests running against a live local server.
-   Component Isolation: Use Component Testing (CT) exclusively for Client Components ("leaf" nodes), complex interactive UI (forms, modals), and shared design system components.
-   Hydration Tolerance: When encountering Minified React error #418 or #423 (Hydration Mismatches) during E2E tests, treat them as warnings, not failures. Configure cypress/support/e2e.ts to explicitly ignore these specific error patterns in the uncaught:exception handler.

## Selector & Assertion Standards

-   The data-cy Contract: Never select elements by CSS class, ID, or tag name (e.g., button, .text-blue-500).
    -   Rule: Always add and use data-cy="[descriptive-id]" attributes for interactive elements.
    -   Example: cy.get('[data-cy="submit-purchase-btn"]') instead of cy.get('button[type="submit"]').
-   Navigation Assertions: Never wait for arbitrary time (cy.wait(1000)) after a navigation action.
    -   Rule: Assert the URL change or a specific UI element visibility immediately after clicking a link.
    -   Example: cy.url().should('include', '/dashboard').

## Next.js Architecture & Mocks

### Component Testing (CT)

-   App Router Mocking: When testing components using next/navigation hooks (useRouter, useSearchParams):
    -   Do not use next-router-mock (legacy).
    -   Rule: Wrap the component in AppRouterContext.Provider imported from next/dist/shared/lib/app-router-context.shared-runtime.
    -   Rule: Stub next/navigation imports if AppRouterContext is insufficient for specific hook return values.
-   Image Optimization: Never allow next/image to trigger network requests in CT.
    -   Rule: Globally override next/image in cypress/support/component.tsx to render a standard HTML <img> tag with the original props.

### End-to-End (E2E)

-   Server Actions: Do not attempt to mock Server Actions using cy.intercept.
    -   Reasoning: Server Actions use complex serialized "Flight" data (e.g., 0:["$@1"...]) that is brittle to mock manually.
    -   Rule: Use Database Seeding (cy.task) to set up state, then allow the real Server Action to execute against the test database.

## Authentication & Security

-   No UI Login: Never write tests that manually type username/password into the login form (except for the dedicated auth.cy.ts spec).
-   Programmatic Auth (Auth.js/NextAuth):
    -   Rule: Use a custom cy.login() command that generates a valid JWE (JSON Web Encryption) session token.
    -   Rule: Use next-auth/jwt (specifically the encode function) to generate the token using the NEXTAUTH_SECRET.
    -   Rule: Set the cookie next-auth.session-token (or \_\_Secure-next-auth.session-token if testing on HTTPS).
-   Social Providers: Bypass third-party providers (Google/Auth0) entirely. Use the "Credentials" provider in the test environment or mock the session at the provider level.

## Data Management

-   Database Seeding: Do not rely on the state left by previous tests.
    -   Rule: Create a specific Cypress Task db:seed or db:reset in cypress.config.ts using setupNodeEvents.
    -   Rule: Call cy.task('db:seed') inside the beforeEach block of every E2E spec file.

## Infrastructure & Configuration

-   Base URL: Always set baseUrl: 'http://localhost:3000' in cypress.config.ts. Never use cy.visit() with a full URL.
-   CI Coordination: Use start-server-and-test to ensure the Next.js server is fully booted (responding to 200 OK) before Cypress launches.
-   TypeScript: Maintain a dedicated tsconfig.cypress.json that includes cypress types and excludes jest types to prevent type collisions in assertions.
