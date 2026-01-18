describe("prophy manager - pending appointment alerts", () => {
    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("admin_user");
    });

    it("highlights pending appointment clients and keeps compliant clients unhighlighted", () => {
        cy.fixture("pending-appointment.json").then((data) => {
            const pendingCnpj: string = data.pending_cnpj;
            const compliantCnpj: string = data.compliant_cnpj;

            cy.visit("/dashboard");
            cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");
            cy.getByCy("search-tab-clients").click();

            cy.getByCy("clients-filter-cnpj").clear().type(pendingCnpj);
            cy.getByCy("clients-apply-filters").click();

            cy.getByCy("clients-results")
                .find('[data-cy^="client-row-"]')
                .should("have.length", 1)
                .first()
                .should("have.class", "bg-red-50")
                .and("have.class", "animate-danger");

            cy.getByCy("clients-results")
                .find('[data-cy="pending-appointment-badge"]')
                .should("have.length", 1);

            cy.getByCy("clients-filter-cnpj").clear().type(compliantCnpj);
            cy.getByCy("clients-apply-filters").click();

            cy.getByCy("clients-results")
                .find('[data-cy^="client-row-"]')
                .should("have.length", 1)
                .first()
                .should("not.have.class", "bg-red-50")
                .and("not.have.class", "animate-danger");

            cy.getByCy("clients-results")
                .find('[data-cy="pending-appointment-badge"]')
                .should("have.length", 0);
        });
    });
});
