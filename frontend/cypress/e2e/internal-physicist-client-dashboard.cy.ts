import { formatPhoneNumber } from "@/utils/format";
import { mask as cnpjMask } from "validation-br/dist/cnpj";

const apiUrl = Cypress.env("apiUrl");

describe("Client dashboard", () => {
    beforeEach(() => {
        cy.fixture("users.json").then((users) => {
            cy.loginSession(
                users.internal_physicist_user.cpf,
                users.internal_physicist_user.password
            );
        });
        cy.visit("/dashboard");
    });

    it("should display the detailed client information when a client is selected", () => {
        cy.fixture("default-clients.json").then((clients) => {
            cy.getByTestId("client-header").should("be.visible");
            cy.getByTestId("client-options")
                .should("be.visible")
                .click()
                .get('[role="option"]')
                .contains(clients.client1.name)
                .click();

            cy.getByTestId("client-details")
                .should("contain", cnpjMask(clients.client1.cnpj))
                .should("contain", formatPhoneNumber(clients.client1.phone))
                .should("contain", clients.client1.email)
                .should("contain", clients.client1.address);
        });
    });

    it("should display the contact information about the client", () => {
        cy.fixture("users.json").then((users) => {
            cy.getByTestId("client-manager")
                .should("be.visible")
                .should("contain", users.client_user.name)
                .should("contain", users.client_user.email)
                .should("contain", formatPhoneNumber(users.client_user.phone));
        });
    });

    it("should display a message indicating a commercial will be assigned to the client", () => {
        cy.getByTestId("empty-comercial").should("be.visible");
    });

    it("should display the information about the comercial", () => {
        cy.fixture("default-clients.json").then((clients) => {
            cy.getByTestId("client-header").should("be.visible");
            cy.getByTestId("client-options")
                .should("be.visible")
                .click()
                .get('[role="option"]')
                .contains(clients.client_with_comercial.name)
                .click();
        });

        cy.fixture("users.json").then((users) => {
            cy.getByTestId("comercial-details")
                .should("be.visible")
                .should("contain", users.comercial_user.name)
                .should("contain", users.comercial_user.email)
                .should(
                    "contain",
                    formatPhoneNumber(users.comercial_user.phone)
                );
        });
    });

    it("should allow switching between different clients", () => {
        cy.fixture("default-clients.json").then((clients) => {
            cy.getByTestId("client-header").should("be.visible");
            cy.getByTestId("client-options")
                .should("be.visible")
                .click()
                .get('[role="option"]')
                .contains(clients.client_with_comercial.name)
                .click();

            cy.getByTestId("client-details")
                .should("contain", cnpjMask(clients.client_with_comercial.cnpj))
                .should(
                    "contain",
                    formatPhoneNumber(clients.client_with_comercial.phone)
                )
                .should("contain", clients.client_with_comercial.email)
                .should("contain", clients.client_with_comercial.address);
        });
    });

    it.only("should display a list of units", () => {
        cy.fixture("default-units").then((units) => {
            cy.getByTestId(`unit-card-${units.unit1.id}`);
            cy.getByTestId(`unit-card-${units.unit2.id}`);
            cy.getByTestId(`unit-card-${units.unit3.id}`);
        });
    });

    context("API Retuns Empty Data", () => {
        it("should display a not found page when no clients are available", () => {
            cy.intercept("GET", `${apiUrl}/clients/?page=1`, {
                statusCode: 200,
                body: {
                    count: 0,
                    next: null,
                    previous: null,
                    results: [],
                },
            }).as("getClients");

            cy.wait("@getClients");

            cy.getByTestId("data-not-found").should("be.visible");
            cy.getByTestId("btn-refresh").should("be.visible");
        });

        it("should display a user page when no units are available", () => {
            cy.intercept("GET", `${apiUrl}/units/?page=1`, {
                statusCode: 200,
                body: {
                    count: 0,
                    next: null,
                    previous: null,
                    results: [],
                },
            }).as("getUnits");

            cy.wait("@getUnits");

            cy.getByTestId("unit-not-found").should("be.visible");
        });
    });
});
