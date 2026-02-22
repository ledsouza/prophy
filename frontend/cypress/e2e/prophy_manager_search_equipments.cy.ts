describe("prophy manager - search equipments", () => {
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

            it("navigates to unit details from equipments tab", () => {
                cy.visit("/dashboard");
                cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");

                cy.getByCy("search-tab-equipments").click();

                cy.getByCy("equipments-results").should("exist");

                if (isMobileViewport) {
                    cy.get('[data-cy^="equipment-card-"]')
                        .should("have.length.greaterThan", 0)
                        .first()
                        .within(() => {
                            cy.get('[data-cy^="equipment-details-"]:visible').first().click();
                        });
                } else {
                    cy.getByCy("equipments-results")
                        .find('[data-cy^="equipment-row-"]')
                        .should("have.length.greaterThan", 0);

                    cy.getByCy("equipments-results")
                        .find('[data-cy^="equipment-details-"]:visible')
                        .first()
                        .click();
                }

                cy.location("pathname").should("match", /\/dashboard\/unit\/[0-9]+/);
            });
        });
    });
});
