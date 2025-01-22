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

Cypress.on("uncaught:exception", (err, runnable) => {
    if (err.message.includes("NEXT_REDIRECT")) {
        return false;
    }
});

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

export const fakerPhone = () => {
    return randomMobilePhoneNumber();
};

// Alternatively you can use CommonJS syntax:
// require('./commands')
