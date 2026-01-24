describe("commercial - proposals smoke", () => {
    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("comercial_user");
        cy.viewport(1280, 720);
    });

    it("filters proposals by CNPJ and edits the first result", () => {
        cy.fixture("proposals.json").then((data) => {
            const cnpj: string = data.rejected_cnpj;

            cy.visit("/dashboard");
            cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "C");

            cy.getByCy("commercial-tab-proposals").click();

            cy.getByCy("proposals-filter-cnpj").clear().type(cnpj);
            cy.getByCy("proposals-apply-filters").click();

            cy.getByCy("proposal-edit-modal").should("not.exist");
            cy.get('[data-cy^="proposal-edit-"]').first().click();

            cy.getByCy("proposal-edit-modal").should("exist");
            cy.getByCy("proposal-edit-submit").scrollIntoView().should("be.visible").click();

            cy.getByCy("proposal-edit-modal").should("not.exist");
        });
    });
});
