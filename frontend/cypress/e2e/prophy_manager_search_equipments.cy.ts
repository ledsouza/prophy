describe("prophy manager - search equipments", () => {
    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("admin_user");
    });

    it("navigates to unit details from equipments tab", () => {
        cy.visit("/dashboard");
        cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");

        cy.getByCy("search-tab-equipments").click();

        cy.getByCy("equipments-results").should("exist");
        cy.getByCy("equipments-results")
            .find('[data-cy^="equipment-row-"]')
            .should("have.length.greaterThan", 0);

        cy.getByCy("equipments-results").find('[data-cy^="equipment-details-"]').first().click();

        cy.location("pathname").should("match", /\/dashboard\/unit\/[0-9]+/);
    });
});
