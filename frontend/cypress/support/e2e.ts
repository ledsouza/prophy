// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import { randomMobilePhoneNumber } from "@/utils/generator";
import "./commands";
import { fakerPT_BR as faker } from "@faker-js/faker";

Cypress.on("uncaught:exception", (err, runnable) => {
    if (err.message.includes("NEXT_REDIRECT")) {
        return false;
    }
});

const apiUrl = Cypress.env("apiUrl");

export const registrationFormErrors = {
    emptyCPF: "O CPF deve conter 11 caracteres.",
    shortPassword: "A senha deve conter no mínimo 8 caracteres.",
    shortConfirmPassword:
        "A confirmaçao de senha deve conter no mínimo 8 caracteres.",
    emptyInstitutionName: "Nome da instituição é obrigatório.",
    invalidInstitutionEmail: "E-mail da instituição inválido.",
    shortPhone: "Telefone deve conter no mínimo 10 dígitos.",
    emptyState: "Estado da instituição é obrigatório.",
    emptyCity: "Cidade da instituição é obrigatório.",
    emptyAdress: "Endereço da instituição é obrigatório.",
    emptyContactName: "Nome do contato é obrigatório.",
    invalidContactEmail: "E-mail do contato inválido.",
    invalidPhoneNumber:
        "O número de celular deve estar no padrão de 11 dígitos (DD9XXXXXXXX).",
};

export const clientFormErrors = {
    emptyNote: "A justificative é obrigatória.",
};

export const errorMessages = {
    emptyCPF: "O CPF deve conter 11 caracteres.",
    emptyName: "Nome é obrigatório.",
    emptyCNPJ: "CNPJ é obrigatório.",
    invalidCNPJ: "CNPJ inválido.",
    emptyEmail: "E-mail é obrigatório.",
    shortPassword: "A senha deve conter no mínimo 8 caracteres.",
    emptyInstitutionName: "Nome da instituição é obrigatório.",
    invalidInstitutionEmail: "E-mail da instituição inválido.",
    invalidPhone: "Telefone inválido.",
    emptyPhone: "Telefone é obrigatório.",
    emptyState: "Estado da instituição é obrigatório.",
    emptyCity: "Cidade da instituição é obrigatória.",
    emptyInstituionAddress: "Endereço da instituição é obrigatório.",
    emptyAddress: "Endereço é obrigatório.",
    emptyContactName: "Nome do contato é obrigatório.",
    invalidContactEmail: "E-mail do contato inválido.",
};

export const equipmentFormErrors = {
    emptyModality: "Modalidade é obrigatório.",
    longModality: "Modalidade deve ter no máximo 50 caracteres.",
    emptyManufacturer: "Fabricante é obrigatório.",
    longManufacturer: "Fabricante deve ter no máximo 30 caracteres.",
    emptyModel: "Modelo é obrigatório.",
    longModel: "Modelo deve ter no máximo 30 caracteres.",
};

export const toastMessages = {
    successEditClient: "Dados atualizados com sucesso!",
    successReviewRejectEditClient:
        "Revisão concluída! O cliente será notificado da rejeição.",
    errorEditClient: "Algo deu errado. Tente novamente mais tarde.",
};

export const fakerPhone = () => {
    return randomMobilePhoneNumber();
};

/**
 * Custom command to test validation error messages in the client edit form.
 * This command simulates various user interactions with the form fields and verifies
 * that the appropriate validation error messages are shown when:
 * - No changes are made to the client fields.
 * - Required fields (institution name, email, phone, state, city, address) are left empty.
 * - Invalid email and phone formats are entered.
 *
 *
 * @remarks
 * - The command includes a `cy.wait(400)` delay to allow time for asynchronous data
 *   fetching (e.g., from the IBGE API) before interacting with the form.
 * - Test IDs such as `btn-edit-client`, `submit-btn`, and `validation-error` are used
 *   to locate elements dynamically.
 * - The `errorMessages` object is expected to contain keys like `emptyInstitutionName`,
 *   `invalidInstitutionEmail`, `invalidPhone`, etc., which map to the corresponding
 *   validation error messages.
 */
export function testEditClientFormValidationErrors() {
    it("should display error message when no changes are made to client fields", () => {
        cy.getByTestId("btn-edit-client").should("exist").click();
        cy.wait(400); // Give enough time to get data from IBGE API

        cy.getByTestId("submit-btn").should("exist").click();

        cy.contains("Nenhuma alteração foi detectada nos dados.").should(
            "be.visible"
        );
    });

    it("should display a validation error message when institution name field is empty", () => {
        cy.getByTestId("btn-edit-client").should("exist").click();
        cy.wait(400); // Give enough time to get data from IBGE API

        cy.getByTestId("institution-name-input").type("{selectAll}{del}");

        cy.getByTestId("submit-btn").click();

        cy.getByTestId("validation-error").should(
            "contain",
            errorMessages.emptyInstitutionName
        );
    });

    it("should display a validation error message when institution email field is empty", () => {
        cy.getByTestId("btn-edit-client").should("exist").click();
        cy.wait(400); // Give enough time to get data from IBGE API

        cy.getByTestId("institution-email-input").type("{selectAll}{del}");

        cy.getByTestId("submit-btn").click();

        cy.getByTestId("validation-error").should(
            "contain",
            errorMessages.invalidInstitutionEmail
        );
    });

    it("should display a validation error message when institution phone field is empty", () => {
        cy.getByTestId("btn-edit-client").should("exist").click();
        cy.wait(400); // Give enough time to get data from IBGE API

        cy.getByTestId("institution-phone-input").type("{selectAll}{del}");

        cy.getByTestId("submit-btn").click();

        cy.getByTestId("validation-error").should(
            "contain",
            errorMessages.invalidPhone
        );
    });

    it("should display a validation error message when institution state field is empty", () => {
        cy.getByTestId("btn-edit-client").should("exist").click();
        cy.wait(400); // Give enough time to get data from IBGE API

        cy.getByTestId("institution-state-input").type("{selectAll}{del}{esc}");

        cy.getByTestId("submit-btn").click();

        cy.getByTestId("validation-error").should(
            "contain",
            errorMessages.emptyState
        );
    });

    it("should display a validation error message when institution city field is empty", () => {
        cy.getByTestId("btn-edit-client").should("exist").click();
        cy.wait(400); // Give enough time to get data from IBGE API

        cy.getByTestId("institution-city-input").type("{selectAll}{del}{esc}");

        cy.getByTestId("submit-btn").click();

        cy.getByTestId("validation-error").should(
            "contain",
            errorMessages.emptyCity
        );
    });

    it("should display a validation error message when institution address field is empty", () => {
        cy.getByTestId("btn-edit-client").should("exist").click();
        cy.wait(400); // Give enough time to get data from IBGE API

        cy.getByTestId("institution-address-input").type("{selectAll}{del}");

        cy.getByTestId("submit-btn").click();

        cy.getByTestId("validation-error").should(
            "contain",
            errorMessages.emptyInstituionAddress
        );
    });

    it("should display a validation error message when email is invalid", () => {
        cy.getByTestId("btn-edit-client").should("exist").click();
        cy.wait(400); // Give enough time to get data from IBGE API

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
        cy.wait(400); // Give enough time to get data from IBGE API

        cy.getByTestId("institution-phone-input").type(
            "{selectAll}{del}0000000000"
        );

        cy.getByTestId("submit-btn").click();

        cy.getByTestId("validation-error").should(
            "contain",
            errorMessages.invalidPhone
        );
    });
}

/**
 * Creates a client edit operation by intercepting the POST request and filling the form.
 * After successful creation, the operation response is available through `cy.get('@newClientOperation')`.
 *
 * @param newClientName - The new name to set for the client
 *
 * @example
 * ```ts
 * createEditClientOperation("New Client Name");
 * cy.get('@newClientOperation').then((operation) => {
 *   // work with the operation response
 * });
 * ```
 */
export function createEditClientOperation(newClientName: string) {
    cy.intercept("POST", `${apiUrl}/clients/operations/`).as(
        "createEditClientOperation"
    );

    cy.getByTestId("btn-edit-client").click();
    cy.wait(300); // Give enough time to get data from IBGE API

    cy.getByTestId("institution-name-input").clear().type(newClientName);

    cy.getByTestId("submit-btn").click();

    cy.wait("@createEditClientOperation").then((interception) => {
        expect(interception.response?.statusCode).to.eq(201);
        cy.wrap(interception.response?.body).as("newClientOperation");
    });
}

/**
 * Creates and sets up a client operation review scenario in the application.
 * After successful creation, the operation response is available through `cy.get('@newClientOperation')`.
 *
 * This function performs the following steps:
 * 1. Logs in as a client user using credentials from users.json
 * 2. Navigates to dashboard
 * 3. Creates/edits a client operation with a test name
 * 4. Logs out and logs in as an internal physicist user
 * 5. Verifies the review edit client button is present
 *
 * @remarks
 * This function assumes the existence of a users.json fixture with client_user
 * and internal_physicist_user credentials
 *
 *
 * @requires users.json fixture
 * @requires loginSession custom Cypress command
 * @requires createEditClientOperation function
 */
export function createClientOperationReview() {
    cy.fixture("users.json").then((users) => {
        cy.loginSession(users.client_user.cpf, users.client_user.password);
    });
    cy.visit("/dashboard");

    const newName = faker.company.name();
    createEditClientOperation(newName);

    cy.fixture("users.json").then((users) => {
        cy.loginSession(
            users.internal_physicist_user.cpf,
            users.internal_physicist_user.password
        );
    });
    cy.visit("/dashboard");

    cy.getByTestId("btn-review-edit-client").should("exist");
}

export function confirmReject() {
    cy.getByTestId("btn-reject-edit-client").should("exist").click();
    cy.getByTestId("btn-confirm-reject-client").should("exist").click();
}

// Alternatively you can use CommonJS syntax:
// require('./commands')
