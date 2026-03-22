import {
    DESKTOP_VIEWPORT,
    MOBILE_VIEWPORT,
    describeForViewports,
    visitDashboardAs,
} from "../support/e2eTestUtils";

describe("commercial - clients toggle status", () => {
    beforeEach(() => {
        cy.setupDB();
    });

    describeForViewports([DESKTOP_VIEWPORT, MOBILE_VIEWPORT], (viewport) => {
        it("distributes search tabs equally", () => {
            visitDashboardAs("comercial_user");

            cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "C");

            if (viewport.isMobile) {
                cy.getByCy("commercial-tab-clients")
                    .parent()
                    .should(($tabList) => {
                        const tabList = $tabList[0];
                        expect(tabList.scrollWidth).to.be.greaterThan(tabList.clientWidth);
                    });

                cy.getByCy("commercial-tab-clients").scrollIntoView().should("be.visible");
                cy.getByCy("commercial-tab-proposals").scrollIntoView().should("be.visible");
                cy.getByCy("commercial-tab-appointments")
                    .scrollIntoView()
                    .should("be.visible");
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
            visitDashboardAs("comercial_user");
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
