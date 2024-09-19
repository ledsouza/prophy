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
             * Custom command to select an option in a custom combobox.
             * @example cy.typeCombobox('institution-city-input', 'São Paulo')
             */
            selectCombobox(id: string, option: string): Chainable<void>;

            /**
             * Custom command to log in with given credentials.
             * @param username - The username for login.
             * @param password - The password for login.
             * @example cy.login('admin', 'password123')
             */
            login(username: string, password: string): Chainable<void>;

            /**
             * Custom command to get a random CNPJ from the propostas-aprovadas.json fixture.
             *
             * @example
             * cy.getRandomCnpj().then((cnpj) => {
             *   cy.log(`Random CNPJ: ${cnpj}`);
             * });
             *
             * @returns {Cypress.Chainable<string>} A Cypress chainable that yields a random CNPJ string.
             * @throws {Error} If the fixture file is empty or doesn't contain any CNPJs.
             */
            getRandomCnpj(): Cypress.Chainable<string>;
        }
    }
}

Cypress.Commands.add("getByTestId", (testId: string) => {
    return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add("selectCombobox", (id, option) => {
    cy.getByTestId(id).type(option);
    cy.wait(100);
    cy.get('[role="option"]').click();
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

    cy.wait(500);
});

Cypress.Commands.add("getRandomCnpj", () => {
    return cy.fixture("propostas-aprovadas.json").then((fixtureData) => {
        const cnpjs = fixtureData.approved_cnpjs;

        if (cnpjs.length === 0) {
            throw new Error("No CNPJs found in the fixture file.");
        }

        const randomIndex = Math.floor(Math.random() * cnpjs.length);
        return cnpjs[randomIndex];
    });
});

// This line is necessary to make the file a module and avoid TypeScript errors
export {};
