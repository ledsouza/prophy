describe("register", () => {
    before(() => {
        cy.setupDB();
    });

    it("validates CNPJ and completes registration", () => {
        cy.fixture("eligible-registration.json").then((client) => {
            const cnpj: unknown = client.eligible_registration_cnpj;
            expect(cnpj, "fixture must contain eligible_registration_cnpj").to.be.a("string");

            cy.visit("/auth/register");

            cy.getByCy("register-cnpj-input").type(cnpj as string);
            cy.getByCy("register-cnpj-submit").click();

            cy.getByCy("register-cpf-input").should("exist");
            cy.getByCy("register-password-input").should("exist");
            cy.getByCy("register-submit-btn").should("exist");
        });
    });

    it("submits the full registration form and creates the client, unit, and user association", () => {
        cy.fixture("eligible-registration.json").then((client) => {
            const cnpj: unknown = client.eligible_registration_cnpj;
            expect(cnpj, "fixture must contain eligible_registration_cnpj").to.be.a("string");

            const cpf = "11144477735";
            const password = "Xk9#mVq472Zt";
            const institutionName = "Instituto Registro Completo";
            const institutionRazaoSocial = "Instituto Registro Completo Ltda";

            cy.visit("/auth/register");

            cy.getByCy("register-cnpj-input").type(cnpj as string);
            cy.getByCy("register-cnpj-submit").click();

            cy.getByCy("register-cpf-input").should("be.visible").type(cpf);
            cy.getByCy("register-password-input").type(password);
            cy.getByCy("register-password-confirm-input").type(password);

            cy.getByCy("register-institution-name-input").type(institutionName);
            cy.getByCy("register-institution-razao-social-input").type(
                institutionRazaoSocial,
            );
            cy.getByCy("register-institution-email-input").type(
                "contato@institutocompleto.com",
            );
            cy.getByCy("register-institution-phone-input").type("5133334444");
            cy.getByCy("register-institution-state-input")
                .click()
                .type("Rio Grande do Sul{enter}");
            cy.getByCy("register-institution-city-input")
                .click()
                .type("Porto Alegre{enter}");
            cy.getByCy("register-institution-address-input").type("Rua Completa, 500");

            cy.getByCy("register-contact-name-input").type("Maria Contato");
            cy.getByCy("register-contact-email-input").type(
                "maria.contato@institutocompleto.com",
            );
            cy.getByCy("register-contact-phone-input").type("51988887777");

            cy.getByCy("register-submit-btn").click();

            cy.url().should("include", "/dashboard");

            cy.getByCy("client-options").should("contain", institutionName);
            cy.get('[data-testid="client-details"]').should(
                "contain",
                institutionRazaoSocial,
            );
            cy.get('[data-testid^="unit-card-"]').should("contain", institutionName);
        });
    });
});
