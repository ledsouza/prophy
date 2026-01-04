/// <reference types="cypress" />

type UserFixtureKey =
    | "admin_user"
    | "client_user"
    | "unit_manager_user"
    | "comercial_user"
    | "external_physicist_user"
    | "internal_physicist_user";

type UsersFixture = Record<
    UserFixtureKey,
    {
        cpf: string;
        password: string;
    }
>;

declare global {
    namespace Cypress {
        interface Chainable {
            /** Select element by the `data-cy` attribute. */
            getByCy(value: string): Chainable<JQuery<HTMLElement>>;

            /**
             * Reset the backend database to a deterministic seed.
             * Implemented as a Cypress task that runs Django management
             * commands.
             */
            setupDB(): Chainable<void>;

            /**
             * Programmatic login (no UI).
             * Uses JWT endpoint and sets auth cookies.
             */
            loginAs(user: UserFixtureKey): Chainable<void>;
        }
    }
}

Cypress.Commands.add("getByCy", (value: string) => {
    return cy.get(`[data-cy="${value}"]`);
});

Cypress.Commands.add("setupDB", () => {
    return cy.task("db:seed");
});

Cypress.Commands.add("loginAs", (user: UserFixtureKey) => {
    const apiUrl: string = Cypress.env("apiUrl");

    cy.fixture("users.json").then((users: UsersFixture) => {
        const creds = users[user];
        if (!creds) {
            throw new Error(`Unknown user fixture key: ${user}`);
        }

        cy.request({
            method: "POST",
            url: `${apiUrl}/jwt/create/`,
            body: {
                cpf: creds.cpf,
                password: creds.password,
            },
            failOnStatusCode: true,
        }).then((response) => {
            const { access, refresh } = response.body as {
                access: string;
                refresh: string;
            };

            cy.setCookie("access", access);
            cy.setCookie("refresh", refresh);
        });
    });

    return;
});

export {};
