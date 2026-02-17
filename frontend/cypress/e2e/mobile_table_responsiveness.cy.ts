describe("mobile table responsiveness", () => {
    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("admin_user");
        cy.viewport(390, 844);
    });

    it("keeps client results table within the viewport", () => {
        cy.visit("/dashboard");
        cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");

        cy.getByCy("clients-results").should("exist");

        cy.window().then((win) => {
            const root = win.document.documentElement;
            expect(root.scrollWidth).to.be.at.most(root.clientWidth);
        });
    });

    it("stacks report actions on mobile", () => {
        cy.visit("/dashboard?tab=reports");
        cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");

        cy.getByCy("reports-results").should("exist");

        cy.getByCy("reports-results")
            .find("[data-cy=table-mobile-card]")
            .should("have.length.greaterThan", 0);

        cy.getByCy("reports-results")
            .find('[data-cy^="report-download-"]')
            .first()
            .should("have.class", "w-full");
    });
});
