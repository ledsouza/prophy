describe("prophy manager - reports", () => {
    const viewports: Array<Cypress.ViewportPreset | [number, number]> = [[1280, 720], "iphone-6"];
    const desktopBreakpoint = 640;

    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("admin_user");
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

            it("soft deletes and restores a report from search tab", () => {
                cy.visit("/dashboard");
                cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");

                cy.getByCy("search-tab-reports").click();
                cy.getByCy("reports-results").should("exist");

                if (isMobileViewport) {
                    cy.get('[data-cy^="report-card-"]')
                        .should("have.length.greaterThan", 0)
                        .first()
                        .within(() => {
                            cy.get('[data-cy^="report-soft-delete-"]:visible').first().click();
                        });
                } else {
                    cy.getByCy("reports-results")
                        .find('[data-cy^="report-soft-delete-"]:visible')
                        .first()
                        .scrollIntoView()
                        .click();
                }

                cy.getByCy("report-soft-delete-confirm")
                    .scrollIntoView()
                    .should("be.visible")
                    .click();

                if (isMobileViewport) {
                    cy.get('[data-cy^="report-card-"]')
                        .should("have.length.greaterThan", 0)
                        .first()
                        .within(() => {
                            cy.get('[data-cy^="report-restore-"]:visible').first().click();
                        });
                } else {
                    cy.getByCy("reports-results")
                        .find('[data-cy^="report-restore-"]:visible')
                        .first()
                        .scrollIntoView()
                        .click();
                }

                cy.getByCy("report-restore-confirm").scrollIntoView().should("be.visible").click();
            });
        });
    });
});
