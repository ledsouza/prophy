describe("register", () => {
    beforeEach(() => {
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
});
