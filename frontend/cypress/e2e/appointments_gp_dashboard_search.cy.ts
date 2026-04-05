describe("appointments - GP dashboard search", () => {
    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("admin_user");
        cy.intercept("POST", "**/api/jwt/verify/").as("verifyAuth");
        cy.intercept("GET", "**/api/users/me/").as("retrieveUser");
    });

    it("opens dashboard appointments tab and shows results + create button", () => {
        cy.visit("/dashboard?tab=appointments");
        cy.wait("@verifyAuth");
        cy.wait("@retrieveUser");
        cy.url().should("include", "/dashboard");
        cy.getByCy("dashboard-root", { timeout: 10000 }).should(
            "have.attr",
            "data-cy-role",
            "GP",
        );

        cy.getByCy("search-tab-appointments").click();

        cy.getByCy("gp-appointments-results").should("exist");
        cy.getByCy("gp-appointments-create-appointment").should("exist");
    });
});
