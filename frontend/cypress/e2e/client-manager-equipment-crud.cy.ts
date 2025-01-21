import { equipmentFormErrors } from "cypress/support/e2e";
import { fakerPT_BR as faker } from "@faker-js/faker";
import { OperationStatus } from "@/enums";

function createEditEquipmentOperation() {
    cy.intercept("POST", `${Cypress.env("apiUrl")}/equipments/operations/`).as(
        "createEditEquipmentOperation"
    );

    const newManufacturer = `TEST EDIT EQUIPMENT ${faker.number.int({
        max: 9999,
    })}`;
    cy.wrap(newManufacturer).as("newManufacturer");
    cy.getByTestId("equipment-manufacturer-input")
        .clear()
        .type(newManufacturer);
    cy.getByTestId("submit-btn").click();

    cy.wait("@createEditEquipmentOperation").then((interception) => {
        expect(interception.response?.statusCode).to.eq(201);

        const { id } = interception.response?.body;
        cy.wrap(id).as("operationID");
    });

    cy.contains("Requisição enviada com sucesso!").should("be.visible");
}

function answerEquipmentOperation(operationStatus: OperationStatus, note = "") {
    cy.fixture("users.json").then((users) => {
        cy.request({
            method: "POST",
            url: `${Cypress.env("apiUrl")}/jwt/create/`,
            body: {
                cpf: users.internal_physicist_user.cpf,
                password: users.internal_physicist_user.password,
            },
        }).then((response) => {
            const { access } = response.body;
            cy.wrap(access).as("FMIToken");
        });
    });

    cy.get("@operationID").then((operationID) => {
        cy.get("@FMIToken").then((FMIToken) => {
            cy.request({
                method: "PUT",
                url: `${Cypress.env(
                    "apiUrl"
                )}/equipments/operations/${operationID}/`,
                body: {
                    operation_status: operationStatus,
                    note: note,
                },
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${FMIToken}`,
                },
            });
        });
    });
}

function accessUnitDetailPage() {
    cy.fixture("users.json").then((users) => {
        cy.loginSession(users.client_user.cpf, users.client_user.password);
    });
    cy.fixture("default-units.json").then((units) => {
        cy.visit(`/dashboard/unit/${units.unit1.id}`);
    });
}

describe("Client Manager Equipment CRUD", () => {
    beforeEach(() => {
        accessUnitDetailPage();
    });
    context("Edit Equipment", () => {
        beforeEach(() => {
            cy.fixture("default-equipments.json").then((equipments) => {
                cy.getByNestedTestId([
                    `equipment-card-${equipments.equipment1.id}`,
                    "btn-edit-operation",
                ]).click();
            });
        });

        context("Failure Scenario", () => {
            it("should display an error message when the user submits without changing any field", () => {
                cy.getByTestId("submit-btn").click();
                cy.contains(
                    "Nenhuma alteração foi detectada nos dados."
                ).should("be.visible");
            });

            it("should display an error message when modality input is empty", () => {
                cy.getByTestId("equipment-modality-input").clear();
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error")
                    .should("exist")
                    .and("contain", equipmentFormErrors.emptyModality);
            });

            it("should display an error message when manufacturer input is empty", () => {
                cy.getByTestId("equipment-manufacturer-input").clear();
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error")
                    .should("exist")
                    .and("contain", equipmentFormErrors.emptyManufacturer);
            });

            it("should display an error message when model input is empty", () => {
                cy.getByTestId("equipment-model-input").clear();
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error")
                    .should("exist")
                    .and("contain", equipmentFormErrors.emptyModel);
            });

            it("should display an error message when file has more than 5MB", () => {
                cy.getByTestId("equipment-photo-input").selectFile(
                    "cypress/fixtures/5MB.jpg"
                );
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error")
                    .should("exist")
                    .and("contain", "O arquivo não pode ser maior que 5MB.");
            });
        });

        context("Success Scenario", () => {
            it("should successfully cancel the operation", () => {
                createEditEquipmentOperation();

                cy.fixture("default-equipments.json").then((equipments) => {
                    cy.getByNestedTestId([
                        `equipment-card-${equipments.equipment1.id}`,
                        "btn-cancel-operation",
                    ]).click();
                });

                cy.contains("Requisição cancelada com sucesso!").should(
                    "be.visible"
                );
            });

            it("should successfully receive a rejected operation", () => {
                createEditEquipmentOperation();

                const note = "REJEITADA";
                answerEquipmentOperation(OperationStatus.REJECTED, note);
                accessUnitDetailPage();
                cy.fixture("default-equipments.json").then((equipments) => {
                    cy.getByNestedTestId([
                        `equipment-card-${equipments.equipment1.id}`,
                        "btn-reject-operation",
                    ]).click();
                });

                cy.contains(note).should("be.visible");
                cy.getByTestId("btn-confirm-reject-equipment")
                    .should("exist")
                    .click();
            });

            it("should successfully receive an accepted operation", () => {
                createEditEquipmentOperation();
                answerEquipmentOperation(OperationStatus.ACCEPTED);
                accessUnitDetailPage();
                cy.fixture("default-equipments.json").then((equipments) => {
                    cy.get("@newManufacturer").then((newManufacturer) => {
                        cy.getByTestId(
                            `equipment-card-${equipments.equipment1.id}`
                        ).should("contain", newManufacturer);
                    });
                });
            });
        });
    });

    context("Add Equipment", () => {});
    context("Delete Equipment", () => {});
});
