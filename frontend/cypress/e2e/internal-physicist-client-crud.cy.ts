import { ClientOperationDTO } from "@/redux/features/clientApiSlice";
import {
    clientFormErrors,
    confirmReject,
    createClientOperationReview,
    testEditClientFormValidationErrors,
    toastMessages,
} from "cypress/support/e2e";
import { fakerPT_BR as faker } from "@faker-js/faker";

describe("Internal Medical Physicist Client CRUD", () => {
    beforeEach(() => {
        cy.fixture("users.json").then((users) => {
            cy.loginSession(
                users.internal_physicist_user.cpf,
                users.internal_physicist_user.password
            );
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
                cy.wait(400); // Give enough time to get data from IBGE API
            });

            it("should succesfully update the name of the client", () => {
                const newName = faker.company.name();
                cy.getByTestId("institution-name-input")
                    .should("exist")
                    .clear()
                    .type(newName);
                cy.getByTestId("submit-btn").should("exist").click();
                cy.contains(toastMessages.successEditClient).should(
                    "be.visible"
                );
                cy.getByTestId("client-options")
                    .should("be.visible")
                    .click()
                    .get('[role="option"]')
                    .contains(newName);
            });
        });
    });

    context.only("Review Edit Client", () => {
        context("Success Scenario", () => {
            it("should receive an operation for review", () => {
                createClientOperationReview();
            });

            it("should allow to reject the operation", () => {
                cy.getByTestId("btn-review-edit-client").click();
                cy.getByTestId("reject-btn").should("exist").click();
                cy.getByTestId("rejection-note-input").type("TEST");
                cy.getByTestId("submit-rejection-btn").should("exist").click();
                cy.contains(toastMessages.successReviewRejectEditClient).should(
                    "be.visible"
                );

                cy.fixture("users.json").then((users) => {
                    cy.loginSession(
                        users.client_user.cpf,
                        users.client_user.password
                    );
                });
                cy.visit("/dashboard");
                confirmReject();
            });

            it("should allow to accept the operation", () => {
                createClientOperationReview();
                cy.getByTestId("btn-review-edit-client").click();

                const newEmail = "test@email.com";
                cy.getByTestId("institution-email-input")
                    .first()
                    .clear()
                    .type(newEmail);

                cy.getByTestId("submit-btn").should("exist").click();
                cy.contains(toastMessages.successEditClient).should(
                    "be.visible"
                );

                cy.getByTestId("client-details").should("contain", newEmail);
                cy.get<ClientOperationDTO>("@newClientOperation").then(
                    (newClientOperation) => {
                        cy.getByTestId("client-options")
                            .should("be.visible")
                            .click()
                            .get('[role="option"]')
                            .contains(newClientOperation.name);
                    }
                );
            });
        });

        context("Failure Scenario", () => {
            it("should display error message when note input empty", () => {
                createClientOperationReview();
                cy.getByTestId("btn-review-edit-client").click();
                cy.getByTestId("reject-btn").should("exist").click();
                cy.getByTestId("submit-rejection-btn").should("exist").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    clientFormErrors.emptyNote
                );

                cy.getByTestId("back-btn").click();
                cy.getByTestId("submit-btn").click();
                cy.contains(toastMessages.successEditClient).should(
                    "be.visible"
                );
            });
        });
    });
});
