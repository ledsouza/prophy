describe("commercial - appointments smoke", () => {
    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("comercial_user");
    });

    it("opens appointments tab and shows results", () => {
        cy.visit("/dashboard");
        cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "C");

        cy.getByCy("commercial-tab-appointments").click();

        cy.getByCy("commercial-appointments-results").should("exist");
        cy.getByCy("commercial-appointments-results")
            .find('[data-cy^="commercial-appointment-row-"]')
            .should("have.length.greaterThan", 0);
    });
});
