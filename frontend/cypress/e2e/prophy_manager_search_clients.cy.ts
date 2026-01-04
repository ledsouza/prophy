describe("prophy manager - search clients", () => {
    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("admin_user");
    });

    it("filters clients by CNPJ and navigates to details and proposals", () => {
        cy.fixture("registered-client.json").then((data) => {
            const cnpj: string = data.registered_cnpj;

            cy.visit("/dashboard");
            cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");
            cy.getByCy("search-tab-clients").click();

            cy.getByCy("clients-filter-cnpj").clear().type(cnpj);
            cy.getByCy("clients-apply-filters").click();

            cy.getByCy("clients-results").should("exist");
            cy.getByCy("clients-results")
                .find('[data-cy^="client-row-"]')
                .should("have.length.greaterThan", 0);

            cy.getByCy("clients-results").find('[data-cy^="client-details-"]').first().click();
            cy.url().should("include", `/dashboard/client/${cnpj}`);

            cy.visit("/dashboard");
            cy.getByCy("search-tab-clients").click();
            cy.getByCy("clients-filter-cnpj").clear().type(cnpj);
            cy.getByCy("clients-apply-filters").click();

            cy.getByCy("clients-results").find('[data-cy^="client-proposals-"]').first().click();
            cy.location("pathname").should("eq", "/dashboard/proposals/");
            cy.location("search").should("eq", `?cnpj=${cnpj}`);
        });
    });
});
