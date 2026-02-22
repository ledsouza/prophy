describe("commercial - proposals smoke", () => {
    const viewports: Array<Cypress.ViewportPreset | [number, number]> = [[1280, 720], "iphone-6"];
    const desktopBreakpoint = 640;

    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("comercial_user");
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

            it("filters proposals by CNPJ and edits the first result", () => {
                cy.fixture("proposals.json").then((data) => {
                    const cnpj: string = data.rejected_cnpj;

                    cy.visit("/dashboard");
                    cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "C");

                    cy.getByCy("commercial-tab-proposals").click();

                    cy.getByCy("proposals-filter-cnpj").clear().type(cnpj);
                    cy.getByCy("proposals-apply-filters").click();

                    cy.getByCy("proposal-edit-modal").should("not.exist");

                    if (isMobileViewport) {
                        cy.get('[data-cy^="proposal-card-"]')
                            .should("have.length.greaterThan", 0)
                            .first()
                            .within(() => {
                                cy.get('[data-cy^="proposal-edit-"]:visible').first().click();
                            });
                    } else {
                        cy.get('[data-cy^="proposal-edit-"]:visible')
                            .first()
                            .scrollIntoView()
                            .click();
                    }

                    cy.getByCy("proposal-edit-modal").should("exist");
                    cy.getByCy("proposal-edit-submit")
                        .scrollIntoView()
                        .should("be.visible")
                        .click();

                    cy.getByCy("proposal-edit-modal").should("not.exist");
                });
            });
        });
    });
});
