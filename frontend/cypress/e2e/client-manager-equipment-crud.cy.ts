import { equipmentFormErrors } from "cypress/support/e2e";
import { fakerPT_BR as faker } from "@faker-js/faker";
import { OperationStatus } from "@/enums";
import {
    EquipmentDTO,
    EquipmentOperationDTO,
} from "@/redux/features/equipmentApiSlice";

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

/**
 * Creates and submits a new equipment operation through the UI form and validates the API response.
 *
 * This function performs the following steps:
 * 1. Intercepts the POST request for creating equipment operations
 * 2. Generates fake data for a new equipment
 * 3. Fills out the equipment form fields with the generated data
 * 4. Uploads required equipment photos
 * 5. Submits the form
 * 6. Validates the API response status code (201)
 * 7. Stores the response body as an alias for later use (@equipmentOperation)
 *
 * The function requires the following test data files to be present:
 * - cypress/fixtures/mamografia.jpg
 * - cypress/fixtures/serial-number-label.jpg
 *
 * @example
 * ```typescript
 * createAddEquipmentOperation();
 * ```
 *
 * @remarks
 * This function uses Cypress commands and expects to be run within a Cypress test context.
 *
 * @throws Will throw an error if the API response status code is not 201
 */
function createAddEquipmentOperation() {
    cy.intercept("POST", `${Cypress.env("apiUrl")}/equipments/operations/`).as(
        "createAddEquipmentOperation"
    );

    const newEquipment: Omit<EquipmentDTO, "id" | "unit"> = {
        modality: faker.lorem.word(),
        manufacturer: faker.lorem.word(),
        model: faker.lorem.word(),
        series_number: faker.lorem.word(),
        anvisa_registry: faker.lorem.word(),
    };

    cy.getByTestId("equipment-modality-input").type(newEquipment.modality);
    cy.getByTestId("equipment-manufacturer-input").type(
        newEquipment.manufacturer
    );
    cy.getByTestId("equipment-model-input").type(newEquipment.model);
    cy.getByTestId("equipment-series-number-input").type(
        newEquipment.series_number ? newEquipment.series_number : ""
    );
    cy.getByTestId("equipment-anvisa-registry-input").type(
        newEquipment.anvisa_registry ? newEquipment.anvisa_registry : ""
    );
    cy.getByTestId("equipment-photo-input").selectFile(
        "cypress/fixtures/mamografia.jpg"
    );
    cy.getByTestId("equipment-label-input").selectFile(
        "cypress/fixtures/serial-number-label.jpg"
    );
    cy.getByTestId("submit-btn").click();

    cy.wait("@createAddEquipmentOperation").then((interception) => {
        expect(interception.response?.statusCode).to.eq(201);

        const respBody = interception.response?.body;
        cy.wrap(respBody).as("equipmentOperation");
    });

    cy.contains("Requisição enviada com sucesso!").should("be.visible");
}

/**
 * Creates a delete equipment operation and verifies the API response.
 *
 * This function performs the following steps:
 * 1. Intercepts the POST request to create a delete equipment operation
 * 2. Clicks the delete button on the equipment card using the equipment ID
 * 3. Waits for the API response and verifies it returns 201 status code
 * 4. Stores the operation response body as "equipmentOperation" alias
 * 5. Verifies success message is displayed
 *
 * @remarks
 * Requires a previously stored equipment object under the "@newEquipment" alias
 *
 * @example
 * ```typescript
 * createDeleteEquipmentOperation();
 * ```
 */
function createDeleteEquipmentOperation() {
    cy.intercept("POST", `${Cypress.env("apiUrl")}/equipments/operations/`).as(
        "createDeleteEquipmentOperation"
    );

    cy.get<EquipmentOperationDTO>("@newEquipment").then((newEquipment) => {
        cy.getByNestedTestId([
            `equipment-card-${newEquipment.id}`,
            "btn-delete-operation",
        ]).click();
    });

    cy.getByTestId("btn-confirm-delete-unit").click();

    cy.wait("@createDeleteEquipmentOperation").then((interception) => {
        expect(interception.response?.statusCode).to.eq(201);

        const respBody = interception.response?.body;
        cy.wrap(respBody).as("equipmentOperation");
    });

    cy.contains("Requisição enviada com sucesso!").should("be.visible");
}

/**
 * Processes an equipment operation response by authenticating as an internal physicist user
 * and updating the operation status.
 *
 * @param operationStatus - The status to set for the equipment operation
 * @param note - Optional note to include with the operation update (defaults to empty string)
 *
 * @remarks
 * This function performs two main steps:
 * 1. Authenticates using credentials from users.json fixture to obtain a JWT token
 * 2. Updates the operation status using the operation ID stored in Cypress alias '@operationID'
 *
 * @requires cypress/fixtures/users.json - Must contain internal_physicist_user credentials
 * @requires Cypress.env("apiUrl") - API base URL must be configured
 * @requires '@operationID' - Cypress alias containing the operation ID must be set
 */
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

    context("Add Equipment", () => {
        beforeEach(() => {
            cy.getByTestId("btn-add-equipment").click();
        });

        context("Failure Scenario", () => {
            it("should display an error message when modality input is empty", () => {
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error")
                    .should("exist")
                    .and("contain", equipmentFormErrors.emptyModality);
            });

            it("should display an error message when manufacturer input is empty", () => {
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error")
                    .should("exist")
                    .and("contain", equipmentFormErrors.emptyManufacturer);
            });

            it("should display an error message when model input is empty", () => {
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
            beforeEach(() => {
                createAddEquipmentOperation();
            });

            it("should successfully cancel the operation", () => {
                cy.get<EquipmentOperationDTO>("@equipmentOperation").then(
                    (equipmentOperation) => {
                        cy.getByNestedTestId([
                            `equipment-card-${equipmentOperation.id}`,
                            "btn-cancel-operation",
                        ])
                            .should("exist")
                            .click();
                        cy.contains("Requisição cancelada com sucesso!").should(
                            "be.visible"
                        );
                        cy.getByTestId(
                            `equipment-card-${equipmentOperation.id}`
                        ).should("not.exist");
                    }
                );
            });

            it("should successfully receive a rejected operation", () => {
                cy.get<EquipmentOperationDTO>("@equipmentOperation").then(
                    (equipmentOperation) => {
                        cy.wrap(equipmentOperation.id).as("operationID");
                        const note = "REJEITADA";
                        answerEquipmentOperation(
                            OperationStatus.REJECTED,
                            note
                        );
                        accessUnitDetailPage();
                        cy.getByNestedTestId([
                            `equipment-card-${equipmentOperation.id}`,
                            "btn-reject-operation",
                        ])
                            .should("exist")
                            .click();
                        cy.contains(note).should("be.visible");
                        cy.getByTestId("btn-confirm-reject-equipment")
                            .should("exist")
                            .click();
                        cy.getByTestId(
                            `equipment-card-${equipmentOperation.id}`
                        ).should("not.exist");
                    }
                );
            });

            it("should successfully receive an accepted operation", () => {
                cy.get<EquipmentOperationDTO>("@equipmentOperation").then(
                    (equipmentOperation) => {
                        cy.wrap(equipmentOperation.id).as("operationID");
                        answerEquipmentOperation(OperationStatus.ACCEPTED);
                        accessUnitDetailPage();
                        cy.getByTestId(
                            `equipment-card-${equipmentOperation.id}`
                        ).should("exist");
                        cy.getByNestedTestId([
                            `equipment-card-${equipmentOperation.id}`,
                            "btn-reject-operation",
                        ]).should("not.exist");
                        cy.getByNestedTestId([
                            `equipment-card-${equipmentOperation.id}`,
                            "btn-details",
                        ]).should("exist");
                        cy.getByNestedTestId([
                            `equipment-card-${equipmentOperation.id}`,
                            "btn-edit-operation",
                        ]).should("exist");
                    }
                );
            });
        });
    });

    context("Delete Equipment", () => {
        beforeEach(() => {
            cy.addEquipment();
            accessUnitDetailPage();
            createDeleteEquipmentOperation();
        });

        it("should successfully cancel the operation", () => {
            cy.get<EquipmentOperationDTO>("@newEquipment").then(
                (newEquipment) => {
                    cy.getByNestedTestId([
                        `equipment-card-${newEquipment.id}`,
                        "btn-cancel-operation",
                    ]).click();
                    cy.contains("Requisição cancelada com sucesso!").should(
                        "be.visible"
                    );
                    cy.getByNestedTestId([
                        `equipment-card-${newEquipment.id}`,
                        "btn-cancel-operation",
                    ]).should("not.exist");
                }
            );
        });

        it("should successfully receive a rejected operation", () => {
            cy.get<EquipmentOperationDTO>("@newEquipment").then(
                (newEquipment) => {
                    cy.get<EquipmentOperationDTO>("@equipmentOperation").then(
                        (equipmentOperation) => {
                            cy.wrap(equipmentOperation.id).as("operationID");
                        }
                    );
                    const note = "REJEITADA";
                    answerEquipmentOperation(OperationStatus.REJECTED, note);
                    accessUnitDetailPage();

                    cy.getByNestedTestId([
                        `equipment-card-${newEquipment.id}`,
                        "btn-reject-operation",
                    ]).click();
                    cy.contains(note).should("be.visible");
                    cy.getByTestId("btn-confirm-reject-equipment")
                        .should("exist")
                        .click();
                    cy.getByNestedTestId([
                        `equipment-card-${newEquipment.id}`,
                        "btn-reject-operation",
                    ]).should("not.exist");
                }
            );
        });

        it("should successfully receive an accepted operation", () => {
            cy.get<EquipmentOperationDTO>("@newEquipment").then(
                (newEquipment) => {
                    cy.get<EquipmentOperationDTO>("@equipmentOperation").then(
                        (equipmentOperation) => {
                            cy.wrap(equipmentOperation.id).as("operationID");
                        }
                    );
                    answerEquipmentOperation(OperationStatus.ACCEPTED);
                    accessUnitDetailPage();

                    cy.getByTestId(`equipment-card-${newEquipment.id}`).should(
                        "not.exist"
                    );
                }
            );
        });
    });
});
