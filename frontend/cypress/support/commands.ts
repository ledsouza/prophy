/// <reference types="cypress" />
// ***********************************************
declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Custom command to select DOM element by data-testid attribute.
             * @example cy.getByTestId('greeting')
             */
            getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
        }
    }
}

Cypress.Commands.add("getByTestId", (testId: string) => {
    return cy.get(`[data-testid="${testId}"]`);
});

// This line is necessary to make the file a module and avoid TypeScript errors
export {};
