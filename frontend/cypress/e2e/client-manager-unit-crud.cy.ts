import { OperationStatus } from "@/enums";
import { UnitDTO } from "@/redux/features/unitApiSlice";
import { errorMessages, fakerPhone } from "cypress/support/e2e";

import * as cnpj from "validation-br/dist/cnpj";
import { fakerPT_BR as faker } from "@faker-js/faker";

const apiUrl = Cypress.env("apiUrl");

function openAddUnitModal() {
    cy.getByTestId("btn-add-unit").should("exist").click();
    cy.wait(300); // Give enough time to get data from IBGE API
}

function openEditUnitModal() {
    cy.fixture("default-units.json").then((units) => {
        cy.getByNestedTestId([
            `unit-card-${units.unit1.id}`,
            "btn-edit-unit",
        ]).click();
    });
    cy.wait(300); // Give enough time to get data from IBGE API
}

function createEditUnitOperation(newUnitName: string) {
    cy.intercept("POST", `${apiUrl}/units/operations/`).as(
        "createEditUnitOperation"
    );

    cy.getByTestId("unit-name-input").type(`{selectAll}{del}${newUnitName}`);

    cy.getByTestId("submit-btn").click();

    cy.wait("@createEditUnitOperation").then((interception) => {
        expect(interception.response?.statusCode).to.eq(201);

        const { id } = interception.response?.body;
        cy.setCookie("operationID", String(id));
    });
}

function createAddUnitOperation(newUnit: UnitDTO) {
    cy.intercept("POST", `${apiUrl}/units/operations/`).as(
        "createAddUnitOperation"
    );

    cy.getByTestId("unit-name-input").type(newUnit.name);
    cy.getByTestId("unit-cnpj-input").type(newUnit.cnpj);
    cy.getByTestId("unit-email-input").type(newUnit.email);
    cy.getByTestId("unit-phone-input").type(newUnit.phone);
    cy.selectCombobox("unit-state-input", newUnit.state);
    cy.selectCombobox("unit-city-input", newUnit.city);
    cy.getByTestId("unit-address-input").type(newUnit.address);

    cy.getByTestId("submit-btn").click();

    cy.wait("@createAddUnitOperation").then((interception) => {
        expect(interception.response?.statusCode).to.eq(201);

        const { id } = interception.response?.body;
        cy.setCookie("operationID", String(id));
        newUnit.id = id;
    });
}

function answerUnitOperation(operationStatus: OperationStatus, note = "") {
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
                url: `${apiUrl}/units/operations/${operationIDCookie?.value}/`,
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

describe("Client Manager Unit CRUD", () => {
    beforeEach(() => {
        cy.fixture("users.json").then((users) => {
            cy.loginSession(users.client_user.cpf, users.client_user.password);
        });
        cy.visit("/dashboard");
    });

    context("Edit Unit", () => {
        context("Failure Scenario", () => {
            beforeEach(() => {
                openEditUnitModal();
            });

            it("should display validation error message when no name is provided", () => {
                cy.getByTestId("unit-name-input").type("{selectAll}{del}");
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.emptyName
                );
            });

            it("should display validation error message when no CNPJ is provided", () => {
                cy.getByTestId("unit-cnpj-input").type("{selectAll}{del}");
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.emptyCNPJ
                );
            });

            it("should display validation error message when CNPJ is invalid", () => {
                // Invalid with 14 digits
                cy.getByTestId("unit-cnpj-input").type(
                    "{selectAll}{del}00000000000000"
                );
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.invalidCNPJ
                );

                // Invalid with less than 14 digits
                cy.getByTestId("unit-cnpj-input").type(
                    "{selectAll}{del}0000000000000"
                );
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.invalidCNPJ
                );
            });

            it("should display validation error message when no email is provided", () => {
                cy.getByTestId("unit-email-input").type("{selectAll}{del}");
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.emptyEmail
                );
            });

            it("should display validation error message when no phone is provided", () => {
                cy.getByTestId("unit-phone-input").type("{selectAll}{del}");
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.emptyPhone
                );
            });

            it("should display validation error message when invalid phone is provided", () => {
                // When there is 10 digits
                cy.getByTestId("unit-phone-input").type(
                    "{selectAll}{del}0000000000"
                );
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.invalidPhone
                );

                // When there is 11 digits
                cy.getByTestId("unit-phone-input").type(
                    "{selectAll}{del}00000000000"
                );
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.invalidPhone
                );
            });

            it("should display validation error message when no state is provided", () => {
                cy.getByTestId("unit-state-input").type(
                    "{selectAll}{del}{esc}"
                );
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.emptyState
                );
            });

            it("should display validation error message when no city is provided", () => {
                cy.getByTestId("unit-city-input").type("{selectAll}{del}{esc}");
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.emptyCity
                );
            });

            it("should display validation error message when no address is provided", () => {
                cy.getByTestId("unit-address-input").type("{selectAll}{del}");
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.emptyAddress
                );
            });
        });

        context("Success Scenario", () => {
            beforeEach(() => {
                openEditUnitModal();
            });

            it("should successfully cancel the operation", () => {
                createEditUnitOperation("TEST EDIT UNIT");

                cy.getByTestId("btn-cancel-unit-operation")
                    .should("exist")
                    .click();

                cy.getByTestId("btn-edit-unit").first().should("exist");
            });

            it("should succesfully receive a rejected operation", () => {
                createEditUnitOperation("TEST EDIT UNIT");

                const note = "Rejeitado";
                answerUnitOperation(OperationStatus.REJECTED, note);

                cy.fixture("users.json").then((users) => {
                    cy.loginSession(
                        users.client_user.cpf,
                        users.client_user.password
                    );
                });

                cy.visit("/dashboard");

                cy.getByTestId("btn-reject-edit-unit-operation")
                    .should("exist")
                    .click();

                cy.contains(note).should("be.visible");

                cy.getByTestId("btn-confirm-reject-unit")
                    .should("exist")
                    .click();
            });

            it("should succesfully receive an accepted operation", () => {
                const newUnitName = "TEST EDIT UNIT";
                createEditUnitOperation(newUnitName);

                answerUnitOperation(OperationStatus.ACCEPTED);

                cy.fixture("users.json").then((users) => {
                    cy.loginSession(
                        users.client_user.cpf,
                        users.client_user.password
                    );
                });

                cy.visit("/dashboard");

                cy.fixture("default-units.json").then((units) => {
                    cy.getByNestedTestId([
                        `unit-card-${units.unit1.id}`,
                        "unit-name",
                    ]).should("contain", newUnitName);
                });
            });
        });
    });

    context("Add Unit", () => {
        beforeEach(() => {
            openAddUnitModal();
        });

        context("Failure Scenario", () => {
            it("should display validation error message when no name is provided", () => {
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.emptyName
                );
            });

            it("should display validation error message when no CNPJ is provided", () => {
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.emptyCNPJ
                );
            });

            it("should display validation error message when CNPJ is invalid", () => {
                // Invalid with 14 digits
                cy.getByTestId("unit-cnpj-input").type("00000000000000");
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.invalidCNPJ
                );

                // Invalid with less than 14 digits
                cy.getByTestId("unit-cnpj-input").type("0000000000000");
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.invalidCNPJ
                );
            });

            it("should display validation error message when no email is provided", () => {
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.emptyEmail
                );
            });

            it("should display validation error message when no phone is provided", () => {
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.emptyPhone
                );
            });

            it("should display validation error message when invalid phone is provided", () => {
                // When there is 10 digits
                cy.getByTestId("unit-phone-input").type("0000000000");
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.invalidPhone
                );

                // When there is 11 digits
                cy.getByTestId("unit-phone-input").type("00000000000");
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.invalidPhone
                );
            });

            it("should display validation error message when no state is provided", () => {
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.emptyState
                );
            });

            it("should display validation error message when no city is provided", () => {
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.emptyCity
                );
            });

            it("should display validation error message when no address is provided", () => {
                cy.getByTestId("submit-btn").click();
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessages.emptyAddress
                );
            });
        });

        context("Success Scenario", () => {
            it("should successfully cancel the operation", () => {
                const newUnit = {
                    name: "TEST ADD UNIT",
                    cnpj: cnpj.fake({ alphanumeric: false }),
                    email: faker.internet.email(),
                    phone: fakerPhone(),
                    state: "Rio Grande do Sul",
                    city: "Porto Alegre",
                    address: "Teste",
                } as UnitDTO;
                createAddUnitOperation(newUnit);

                cy.getCookie("operationID").then((unitIDCookie) => {
                    cy.getByTestId(`unit-card-${unitIDCookie?.value}`).should(
                        "exist"
                    );
                });

                cy.getByTestId("btn-cancel-unit-operation")
                    .should("exist")
                    .click();

                cy.getCookie("operationID").then((unitIDCookie) => {
                    cy.getByTestId(`unit-card-${unitIDCookie?.value}`).should(
                        "not.exist"
                    );
                });
            });

            it("should succesfully receive a rejected operation", () => {
                const newUnit = {
                    name: "TEST ADD UNIT",
                    cnpj: cnpj.fake({ alphanumeric: false }),
                    email: faker.internet.email(),
                    phone: fakerPhone(),
                    state: "Rio Grande do Sul",
                    city: "Porto Alegre",
                    address: "Teste",
                } as UnitDTO;
                createAddUnitOperation(newUnit);

                const note = "Rejeitado";
                answerUnitOperation(OperationStatus.REJECTED, note);

                cy.fixture("users.json").then((users) => {
                    cy.loginSession(
                        users.client_user.cpf,
                        users.client_user.password
                    );
                });

                cy.visit("/dashboard");

                cy.getByTestId("btn-reject-edit-unit-operation")
                    .should("exist")
                    .click();

                cy.contains(note).should("be.visible");

                cy.getByTestId("btn-confirm-reject-unit")
                    .should("exist")
                    .click();
            });

            it.only("should succesfully receive an accepted operation", () => {
                const newUnit = {
                    name: `TEST ADD UNIT ${faker.number.int()}`,
                    cnpj: cnpj.fake({ alphanumeric: false }),
                    email: faker.internet.email(),
                    phone: fakerPhone(),
                    state: "Rio Grande do Sul",
                    city: "Porto Alegre",
                    address: "Teste",
                } as UnitDTO;
                createAddUnitOperation(newUnit);

                answerUnitOperation(OperationStatus.ACCEPTED);

                cy.fixture("users.json").then((users) => {
                    cy.loginSession(
                        users.client_user.cpf,
                        users.client_user.password
                    );
                });

                cy.visit("/dashboard");

                cy.getByTestId("unit-name").should("contain", newUnit.name);
            });
        });
    });
});
