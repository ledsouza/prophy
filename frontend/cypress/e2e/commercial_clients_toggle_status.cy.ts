describe("commercial - clients toggle status", () => {
    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("comercial_user");
    });

    it("toggles the first client active status", () => {
        cy.visit("/dashboard");
        cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "C");

        cy.getByCy("commercial-tab-clients").click();
        cy.getByCy("commercial-clients-results").should("exist");

        cy.getByCy("commercial-clients-results")
            .find('[data-cy^="commercial-toggle-client-"]')
            .first()
            .click();

        cy.getByCy("commercial-clients-results")
            .find('[data-cy^="commercial-toggle-client-"]')
            .first()
            .should("exist");
    });
});
