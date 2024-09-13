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

            /**
             * Custom command to log in with given credentials.
             * @param username - The username for login.
             * @param password - The password for login.
             * @example cy.login('admin', 'password123')
             */
            login(username: string, password: string): Chainable<void>;
        }
    }
}

Cypress.Commands.add("getByTestId", (testId: string) => {
    return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add("login", (username, password) => {
    cy.intercept("POST", "http://localhost:8000/api/jwt/create/").as(
        "loginRequest"
    );

    cy.getByTestId("username-input").type(username);
    cy.getByTestId("password-input").type(password);
    cy.getByTestId("submit-button").click();

    cy.wait("@loginRequest").then((interception) => {
        expect(interception.response?.statusCode).to.eq(200);

        const { access, refresh } = interception.response?.body;

        cy.setCookie("access", access);
        cy.setCookie("refresh", refresh);
    });

    cy.wait(1000);
});

// This line is necessary to make the file a module and avoid TypeScript errors
export {};
