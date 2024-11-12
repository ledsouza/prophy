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
import "./commands";

Cypress.on("uncaught:exception", (err, runnable) => {
    if (err.message.includes("NEXT_REDIRECT")) {
        return false;
    }
});

export const errorMessages = {
    emptyCPF: "O CPF deve conter 11 caracteres.",
    shortPassword: "A senha deve conter no mínimo 8 caracteres.",
    emptyInstitutionName: "Nome da instituição é obrigatório.",
    invalidInstitutionEmail: "E-mail da instituição inválido.",
    shortPhone: "Telefone deve conter no mínimo 10 dígitos.",
    emptyState: "Estado da instituição é obrigatório.",
    emptyCity: "Cidade da instituição é obrigatório.",
    emptyAddress: "Endereço da instituição é obrigatório.",
    emptyContactName: "Nome do contato é obrigatório.",
    invalidContactEmail: "E-mail do contato inválido.",
};

// Alternatively you can use CommonJS syntax:
// require('./commands')
