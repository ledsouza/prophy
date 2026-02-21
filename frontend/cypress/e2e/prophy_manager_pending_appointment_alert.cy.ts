describe("prophy manager - pending appointment alerts", () => {
    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("admin_user");
    });

    it("highlights pending appointment clients and keeps compliant clients unhighlighted (desktop)", () => {
        cy.fixture("pending-appointment.json").then((data) => {
            const pendingCnpj: string = data.pending_cnpj;
            const compliantCnpj: string = data.compliant_cnpj;
            const resetFilters = () => {
                cy.getByCy("clients-clear-filters").click();
                cy.getByCy("clients-filter-cnpj").should("have.value", "");
                cy.getByCy("clients-results").should("exist");
            };

            const applyCnpjFilter = (cnpj: string) => {
                cy.getByCy("clients-filter-cnpj")
                    .clear({ force: true })
                    .type(cnpj)
                    .should("have.value", cnpj);
                cy.getByCy("clients-apply-filters").click();
                cy.wait("@getClients");
            };

            cy.intercept("GET", "**/api/clients/?*").as("getClients");
            cy.visit("/dashboard");
            cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");
            cy.getByCy("search-tab-clients").click();

            resetFilters();
            applyCnpjFilter(pendingCnpj);

            cy.getByCy("clients-results")
                .find('[data-cy^="client-row-"]')
                .should("have.length", 1)
                .first()
                .as("pendingClientRow");

            cy.get("@pendingClientRow")
                .should("have.class", "bg-red-50")
                .and("have.class", "animate-danger")
                .find('[data-cy="pending-appointment-badge"]')
                .should("have.length", 1);

            resetFilters();
            applyCnpjFilter(compliantCnpj);

            cy.getByCy("clients-results")
                .find('[data-cy^="client-row-"]')
                .should("have.length", 1)
                .first()
                .as("compliantClientRow");

            cy.get("@compliantClientRow")
                .should("not.have.class", "bg-red-50")
                .and("not.have.class", "animate-danger")
                .find('[data-cy="pending-appointment-badge"]')
                .should("have.length", 0);
        });
    });

    it("highlights pending appointment clients and keeps compliant clients unhighlighted (mobile)", () => {
        cy.fixture("pending-appointment.json").then((data) => {
            const pendingCnpj: string = data.pending_cnpj;
            const compliantCnpj: string = data.compliant_cnpj;
            const resetFilters = () => {
                cy.getByCy("clients-clear-filters").click();
                cy.getByCy("clients-filter-cnpj").should("have.value", "");
                cy.getByCy("clients-results").should("exist");
            };

            const applyCnpjFilter = (cnpj: string) => {
                cy.getByCy("clients-filter-cnpj")
                    .clear({ force: true })
                    .type(cnpj)
                    .should("have.value", cnpj);
                cy.getByCy("clients-apply-filters").click();
                cy.wait("@getClients");
            };

            cy.intercept("GET", "**/api/clients/?*").as("getClients");
            cy.viewport("iphone-6");
            cy.visit("/dashboard");
            cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");
            cy.getByCy("search-tab-clients").click();

            resetFilters();
            applyCnpjFilter(pendingCnpj);

            cy.getByCy("clients-results")
                .find('[data-cy^="client-card-"]')
                .should("have.length", 1)
                .first()
                .as("pendingClientCard");

            cy.get("@pendingClientCard")
                .should("have.class", "bg-red-50")
                .find('[data-cy="pending-appointment-badge"]')
                .should("have.length", 1);

            resetFilters();
            applyCnpjFilter(compliantCnpj);

            cy.getByCy("clients-results")
                .find('[data-cy^="client-card-"]')
                .should("have.length", 1)
                .first()
                .as("compliantClientCard");

            cy.get("@compliantClientCard")
                .should("not.have.class", "bg-red-50")
                .find('[data-cy="pending-appointment-badge"]')
                .should("have.length", 0);
        });
    });
});
