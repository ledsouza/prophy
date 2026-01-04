describe("auth", () => {
    before(() => {
        cy.setupDB();
    });

    it("logs in via UI with valid credentials", () => {
        cy.fixture("users.json").then((users) => {
            cy.visit("/auth/login");
            cy.getByCy("login-cpf-input").type(users.admin_user.cpf);
            cy.getByCy("login-password-input").type(users.admin_user.password);
            cy.getByCy("login-submit-btn").click();

            cy.url().should("include", "/dashboard");
        });
    });
});
