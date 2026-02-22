describe("prophy manager - search clients", () => {
    const viewports: Array<Cypress.ViewportPreset | [number, number]> = [[1280, 720], "iphone-6"];
    const desktopBreakpoint = 640;

    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("admin_user");
    });

    it("distributes search tabs equally", () => {
        cy.visit("/dashboard");

        cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");

        cy.getByCy("search-tab-clients").then(($clients) => {
            const clientsWidth = $clients[0].getBoundingClientRect().width;

            cy.getByCy("search-tab-equipments").then(($equipments) => {
                const equipmentsWidth = $equipments[0].getBoundingClientRect().width;

                cy.getByCy("search-tab-reports").then(($reports) => {
                    const reportsWidth = $reports[0].getBoundingClientRect().width;
                    const tolerance = 2;

                    expect(Math.abs(clientsWidth - equipmentsWidth)).to.be.at.most(tolerance);
                    expect(Math.abs(clientsWidth - reportsWidth)).to.be.at.most(tolerance);
                });
            });
        });
    });

    viewports.forEach((viewport) => {
        const isMobileViewport = Array.isArray(viewport)
            ? viewport[0] < desktopBreakpoint
            : viewport === "iphone-6";

        describe(`viewport ${Array.isArray(viewport) ? viewport.join("x") : viewport}`, () => {
            beforeEach(() => {
                if (Array.isArray(viewport)) {
                    cy.viewport(viewport[0], viewport[1]);
                    return;
                }

                cy.viewport(viewport);
            });

            it("filters clients by CNPJ and navigates to details and proposals", () => {
                cy.fixture("registered-client.json").then((data) => {
                    const cnpj: string = data.registered_cnpj;
                    const maskedCnpj = cnpj.replace(
                        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                        "$1.$2.$3/$4-$5",
                    );

                    cy.visit("/dashboard");
                    cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");
                    cy.getByCy("search-tab-clients").click();

                    cy.getByCy("clients-filter-cnpj").clear().type(cnpj);
                    cy.getByCy("clients-apply-filters").click();

                    cy.getByCy("clients-results").should("exist");
                    cy.getByCy("clients-results").should("contain", maskedCnpj);

                    if (isMobileViewport) {
                        cy.get('[data-cy^="client-card-"]')
                            .should("have.length", 1)
                            .first()
                            .within(() => {
                                cy.get('[data-cy^="client-details-"]:visible').first().click();
                            });
                    } else {
                        cy.getByCy("clients-results")
                            .find('[data-cy^="client-row-"]')
                            .should("have.length", 1);
                        cy.getByCy("clients-results")
                            .find('[data-cy^="client-details-"]:visible')
                            .first()
                            .click();
                    }

                    cy.url().should("include", `/dashboard/client/${cnpj}`);

                    cy.visit("/dashboard");
                    cy.getByCy("search-tab-clients").click();
                    cy.getByCy("clients-filter-cnpj").clear().type(cnpj);
                    cy.getByCy("clients-apply-filters").click();

                    cy.getByCy("clients-results").should("contain", maskedCnpj);

                    if (isMobileViewport) {
                        cy.get('[data-cy^="client-card-"]')
                            .should("have.length", 1)
                            .first()
                            .within(() => {
                                cy.get('[data-cy^="client-proposals-"]:visible').first().click();
                            });
                    } else {
                        cy.getByCy("clients-results")
                            .find('[data-cy^="client-proposals-"]:visible')
                            .first()
                            .click();
                    }

                    cy.location("pathname").should("eq", "/dashboard/");
                    cy.location("search").should(
                        "eq",
                        `?tab=proposals&proposal_page=1&proposals_cnpj=${cnpj}`,
                    );
                });
            });
        });
    });
});
