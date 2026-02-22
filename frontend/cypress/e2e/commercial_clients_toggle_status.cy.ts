describe("commercial - clients toggle status", () => {
    const viewports: Array<Cypress.ViewportPreset | [number, number]> = [[1000, 660], "iphone-6"];
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

            it("distributes search tabs equally", () => {
                cy.visit("/dashboard");

                cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "C");

                if (isMobileViewport) {
                    cy.getByCy("commercial-tab-clients")
                        .parent()
                        .should(($tabList) => {
                            const tabList = $tabList[0];
                            expect(tabList.scrollWidth).to.be.greaterThan(tabList.clientWidth);
                        });

                    cy.getByCy("commercial-tab-clients").scrollIntoView().should("be.visible");
                    cy.getByCy("commercial-tab-proposals").scrollIntoView().should("be.visible");
                    cy.getByCy("commercial-tab-appointments").scrollIntoView().should("be.visible");
                    return;
                }

                cy.getByCy("commercial-tab-clients").then(($clients) => {
                    const clientsWidth = $clients[0].getBoundingClientRect().width;

                    cy.getByCy("commercial-tab-proposals").then(($proposals) => {
                        const proposalsWidth = $proposals[0].getBoundingClientRect().width;

                        cy.getByCy("commercial-tab-appointments").then(($appointments) => {
                            const appointmentsWidth =
                                $appointments[0].getBoundingClientRect().width;
                            const tolerance = 2;

                            expect(Math.abs(clientsWidth - proposalsWidth)).to.be.at.most(
                                tolerance,
                            );
                            expect(Math.abs(clientsWidth - appointmentsWidth)).to.be.at.most(
                                tolerance,
                            );
                        });
                    });
                });
            });

            it("toggles the first client active status", () => {
                cy.visit("/dashboard");
                cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "C");

                cy.getByCy("commercial-tab-clients").click();
                cy.getByCy("commercial-clients-results").should("exist");

                cy.getByCy("commercial-clients-results")
                    .find('[data-cy^="commercial-toggle-client-"]:visible')
                    .first()
                    .scrollIntoView()
                    .should("be.visible")
                    .click();

                cy.getByCy("commercial-clients-results")
                    .find('[data-cy^="commercial-toggle-client-"]:visible')
                    .first()
                    .should("exist");
            });
        });
    });
});
