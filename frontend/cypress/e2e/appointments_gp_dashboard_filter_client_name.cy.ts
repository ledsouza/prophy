describe("appointments - GP dashboard filter client name", () => {
    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("admin_user");
    });

    it("applies client_name filter without switching away from appointments tab", () => {
        cy.visit("/dashboard?tab=appointments");
        cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");

        cy.getByCy("search-tab-appointments").click();

        cy.getByCy("gp-appointments-filter-client-name").find("input").type("Clinica");

        cy.getByCy("gp-appointments-apply-filters").click();

        cy.location("search").should("include", "tab=appointments");
        cy.location("search").should("include", "appointments_client_name=");
        cy.getByCy("gp-appointments-results").should("exist");
    });
});
