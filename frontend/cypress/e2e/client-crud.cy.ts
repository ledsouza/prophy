import { OperationStatus } from "@/enums";
import { errorMessages } from "cypress/support/e2e";

const apiUrl = Cypress.env("apiUrl");

describe("Gerente Geral de Cliente Client CRUD", () => {
    beforeEach(() => {
        cy.fixture("users.json").then((users) => {
            cy.loginSession(users.client_user.cpf, users.client_user.password);
        });
        cy.visit("/dashboard");
    });

    context("Updating Client", () => {
        context("Failure Scenario", () => {
            it("should display error message when no changes are made to client fields", () => {
                cy.getByTestId("btn-edit-client").should("exist").click();
                cy.wait(300); // Given enough time to get data from IBGE API

                cy.getByTestId("submit-btn").should("exist").click();

                cy.contains(
                    "Nenhuma alteração foi detectada nos dados."
                ).should("be.visible");
            });

            it("should display a validation error message when institution name field is empty", () => {
                cy.getByTestId("btn-edit-client").should("exist").click();
                cy.wait(300); // Given enough time to get data from IBGE API

                cy.getByTestId("institution-name-input").type(
                    "{selectAll}{del}"
                );

                cy.getByTestId("submit-btn").click();

                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.emptyInstitutionName
                );
            });

            it("should display a validation error message when institution email field is empty", () => {
                cy.getByTestId("btn-edit-client").should("exist").click();
                cy.wait(300); // Given enough time to get data from IBGE API

                cy.getByTestId("institution-email-input").type(
                    "{selectAll}{del}"
                );

                cy.getByTestId("submit-btn").click();

                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.invalidInstitutionEmail
                );
            });

            it("should display a validation error message when institution phone field is empty", () => {
                cy.getByTestId("btn-edit-client").should("exist").click();
                cy.wait(300); // Given enough time to get data from IBGE API

                cy.getByTestId("institution-phone-input").type(
                    "{selectAll}{del}"
                );

                cy.getByTestId("submit-btn").click();

                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.invalidPhone
                );
            });

            it("should display a validation error message when institution state field is empty", () => {
                cy.getByTestId("btn-edit-client").should("exist").click();
                cy.wait(300); // Given enough time to get data from IBGE API

                cy.getByTestId("institution-state-input").type(
                    "{selectAll}{del}{esc}"
                );

                cy.getByTestId("submit-btn").click();

                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.emptyState
                );
            });

            it("should display a validation error message when institution city field is empty", () => {
                cy.getByTestId("btn-edit-client").should("exist").click();
                cy.wait(300); // Given enough time to get data from IBGE API

                cy.getByTestId("institution-city-input").type(
                    "{selectAll}{del}{esc}"
                );

                cy.getByTestId("submit-btn").click();

                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.emptyCity
                );
            });

            it("should display a validation error message when institution address field is empty", () => {
                cy.getByTestId("btn-edit-client").should("exist").click();
                cy.wait(300); // Given enough time to get data from IBGE API

                cy.getByTestId("institution-address-input").type(
                    "{selectAll}{del}"
                );

                cy.getByTestId("submit-btn").click();

                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.emptyAddress
                );
            });

            it("should display a validation error message when email is invalid", () => {
                cy.getByTestId("btn-edit-client").should("exist").click();
                cy.wait(300); // Given enough time to get data from IBGE API

                cy.getByTestId("institution-email-input").type(
                    "{selectAll}{del}invalid email"
                );

                cy.getByTestId("submit-btn").click();

                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.invalidInstitutionEmail
                );
            });

            it("should display a validation error message when phone is invalid", () => {
                cy.getByTestId("btn-edit-client").should("exist").click();
                cy.wait(300); // Given enough time to get data from IBGE API

                cy.getByTestId("institution-phone-input").type(
                    "{selectAll}{del}0000000000"
                );

                cy.getByTestId("submit-btn").click();

                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.invalidPhone
                );
            });
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
                cy.intercept("POST", `${apiUrl}/clients/operations/`).as(
                    "createEditClientOperation"
                );

                cy.getByTestId("institution-name-input").type(
                    "{selectAll}{del}TEST EDIT CLIENT"
                );

                cy.getByTestId("submit-btn").click();

                cy.wait("@createEditClientOperation").then((interception) => {
                    expect(interception.response?.statusCode).to.eq(201);

                    const { id } = interception.response?.body;
                    cy.setCookie("operationID", String(id));
                });

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
                                operation_status: OperationStatus.REJECTED,
                            },
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${FMITokenCookie?.value}`,
                            },
                        });
                    });
                });

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

                cy.getByTestId("btn-confirm-reject-client")
                    .should("exist")
                    .click();
            });
        });
    });
});
