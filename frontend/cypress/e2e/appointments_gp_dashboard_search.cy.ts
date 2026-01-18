describe("appointments - GP dashboard search", () => {
    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("admin_user");
    });

    it("opens dashboard appointments tab and shows results + create button", () => {
        cy.visit("/dashboard?tab=appointments");
        cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");

        cy.getByCy("search-tab-appointments").click();

        cy.getByCy("gp-appointments-results").should("exist");
        cy.getByCy("gp-appointments-create-appointment").should("exist");
    });
});
