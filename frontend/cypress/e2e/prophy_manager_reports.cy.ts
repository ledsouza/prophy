describe("prophy manager - reports", () => {
    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("admin_user");
    });

    it("soft deletes and restores a report from search tab", () => {
        cy.visit("/dashboard");
        cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");

        cy.getByCy("search-tab-reports").click();
        cy.getByCy("reports-results").should("exist");

        cy.getByCy("reports-results").find('[data-cy^="report-soft-delete-"]').first().click();
        cy.getByCy("report-soft-delete-confirm").click();

        cy.getByCy("reports-results").find('[data-cy^="report-restore-"]').first().click();
        cy.getByCy("report-restore-confirm").click();
    });
});
