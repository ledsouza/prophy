import { OperationStatus } from "@/enums";
import { testEditClientFormValidationErrors } from "cypress/support/e2e";

const apiUrl = Cypress.env("apiUrl");

function createEditClientOperation(newClientName: string) {
    cy.intercept("POST", `${apiUrl}/clients/operations/`).as(
        "createEditClientOperation"
    );

    cy.getByTestId("institution-name-input").type(
        `{selectAll}{del}${newClientName}`
    );

    cy.getByTestId("submit-btn").click();

    cy.wait("@createEditClientOperation").then((interception) => {
        expect(interception.response?.statusCode).to.eq(201);

        const { id } = interception.response?.body;
        cy.setCookie("operationID", String(id));
    });
}

function answerClientOperation(operationStatus: OperationStatus, note = "") {
    cy.fixture("users.json").then((users) => {
        cy.request({
            method: "POST",
            url: `${apiUrl}/jwt/create/`,
            body: {
                cpf: users.internal_physicist_user.cpf,
                password: users.internal_physicist_user.password,
            },
        }).then((response) => {
            const { access } = response.body;
            cy.setCookie("FMIToken", String(access));
        });
    });

    cy.getCookie("operationID").then((operationIDCookie) => {
        cy.getCookie("FMIToken").then((FMITokenCookie) => {
            cy.request({
                method: "PUT",
                url: `${apiUrl}/clients/operations/${operationIDCookie?.value}/`,
                body: {
                    operation_status: operationStatus,
                    note: note,
                },
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${FMITokenCookie?.value}`,
                },
            });
        });
    });
}

describe("Client Manager Client CRUD", () => {
    beforeEach(() => {
        cy.fixture("users.json").then((users) => {
            cy.loginSession(users.client_user.cpf, users.client_user.password);
        });
        cy.visit("/dashboard");
    });

    context("Edit Client", () => {
        context("Failure Scenario", () => {
            testEditClientFormValidationErrors();
        });

        context("Success Scenario", () => {
            beforeEach(() => {
                cy.getByTestId("btn-edit-client").click();
                cy.wait(300); // Give enough time to get data from IBGE API
            });

            it("should successfully cancel the operation for editing client details", () => {
                cy.getByTestId("institution-name-input")
                    .should("exist")
                    .type("{selectAll}{del}TEST EDIT CLIENT");

                cy.getByTestId("submit-btn").should("exist").click();

                cy.getByTestId("btn-cancel-edit-client")
                    .should("exist")
                    .click();
            });

            it("should successfully receive a rejected operation for editing client details", () => {
                const newClientName = "TEST EDIT CLIENT";
                createEditClientOperation(newClientName);

                const note = "Rejeitado";
                answerClientOperation(OperationStatus.REJECTED, note);

                cy.fixture("users.json").then((users) => {
                    cy.loginSession(
                        users.client_user.cpf,
                        users.client_user.password
                    );
                });

                cy.visit("/dashboard");

                cy.getByTestId("btn-reject-edit-client")
                    .should("exist")
                    .click();

                cy.contains(note).should("be.visible");

                cy.getByTestId("btn-confirm-reject-client")
                    .should("exist")
                    .click();
            });

            it("should succesfully receive an accepted operation for editing client details", () => {
                const newClientName = "TEST EDIT CLIENT";
                createEditClientOperation(newClientName);

                answerClientOperation(OperationStatus.ACCEPTED);

                cy.fixture("users.json").then((users) => {
                    cy.loginSession(
                        users.client_user.cpf,
                        users.client_user.password
                    );
                });

                cy.visit("/dashboard");

                cy.getByTestId("client-options").should(
                    "contain",
                    newClientName
                );
            });
        });
    });
});
