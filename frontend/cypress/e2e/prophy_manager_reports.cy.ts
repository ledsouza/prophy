import {
    DESKTOP_VIEWPORT,
    MOBILE_VIEWPORT,
    describeForViewports,
    visitDashboardAs,
} from "../support/e2eTestUtils";

describe("prophy manager - reports", () => {
    beforeEach(() => {
        cy.setupDB();
    });

    describeForViewports([DESKTOP_VIEWPORT, MOBILE_VIEWPORT], (viewport) => {
        it("soft deletes and restores a report from search tab", () => {
            visitDashboardAs("admin_user");
            cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");

            cy.getByCy("search-tab-reports").click();
            cy.getByCy("reports-results").should("exist");

            if (viewport.isMobile) {
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

            if (viewport.isMobile) {
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

            cy.getByCy("report-restore-confirm")
                .scrollIntoView()
                .should("be.visible")
                .click();
        });
    });
});
