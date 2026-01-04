describe("auth", () => {
    before(() => {
        cy.setupDB();
    });

    it("redirects unauthenticated users from /dashboard to /auth/login", () => {
        cy.clearCookies();
        cy.visit("/dashboard");
        cy.url().should("include", "/auth/login");
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

    it("logs out via navbar", () => {
        cy.loginAs("admin_user");
        cy.visit("/dashboard");
        cy.getByCy("logout-btn").click();
        cy.url().should("include", "/auth/login");
    });
});
