import { fake } from "validation-br/dist/cnpj";

describe("prophy manager - create client", () => {
    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("admin_user");
    });

    it("creates a client, associates users, and shows it in the results list", () => {
        cy.visit("/dashboard");

        cy.getByCy("search-tab-clients").click();
        cy.getByCy("btn-create-client").click();

        const cnpjValue = fake();

        cy.getByCy("create-client-cnpj").type(cnpjValue);
        cy.getByCy("create-client-name").type("Novo Cliente");
        cy.getByCy("create-client-email").type("cliente@novo.com");
        cy.getByCy("create-client-phone").type("11999999999");
        cy.getByCy("create-client-state-input").click().type("São Paulo{enter}");
        cy.getByCy("create-client-city-input").click().type("São Paulo{enter}");
        cy.getByCy("create-client-address").type("Rua Nova, 123");

        cy.getByCy("create-client-submit").click();
        cy.getByCy("create-client-users").should("exist");
        cy.getByCy("create-client-users-button").click();
        cy.getByCy("create-client-users-option-1003").click();
        cy.getByCy("create-client-users-option-1004").click();
        cy.getByCy("create-client-users-button").click();
        cy.getByCy("create-client-users-submit").click();

        cy.getByCy("clients-filter-cnpj").clear().type(cnpjValue);
        cy.getByCy("clients-apply-filters").click();

        cy.getByCy("clients-results").should("contain", "Novo Cliente");
    });

    it("shows validation errors for invalid cnpj and required fields", () => {
        cy.visit("/dashboard");

        cy.getByCy("search-tab-clients").click();
        cy.getByCy("btn-create-client").click();

        cy.getByCy("create-client-cnpj").type("123");
        cy.getByCy("create-client-submit").click();

        cy.get("[data-testid=validation-error]").should("have.length.at.least", 1);
    });
});
