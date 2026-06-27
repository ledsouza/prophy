import {
    DESKTOP_VIEWPORT,
    MOBILE_VIEWPORT,
    describeForViewports,
    visitDashboardAs,
} from "../support/e2eTestUtils";

describe("reports - file download links", () => {
    beforeEach(() => {
        cy.setupDB();
    });

    describeForViewports([DESKTOP_VIEWPORT, MOBILE_VIEWPORT], (viewport) => {
        it("GP sees PDF and Word links in the reports search table", () => {
            visitDashboardAs("admin_user");
            cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");

            cy.getByCy("search-tab-reports").click();
            cy.getByCy("reports-results").should("exist");

            if (viewport.isMobile) {
                cy.get('[data-cy^="report-download-pdf-"]')
                    .should("have.length.greaterThan", 0)
                    .first()
                    .should("have.attr", "href");

                cy.get('[data-cy^="report-download-word-"]')
                    .should("have.length.greaterThan", 0)
                    .first()
                    .should("have.attr", "href");
            } else {
                cy.getByCy("reports-results")
                    .find('[data-cy^="report-download-pdf-"]')
                    .should("have.length.greaterThan", 0)
                    .first()
                    .should("have.attr", "href");

                cy.getByCy("reports-results")
                    .find('[data-cy^="report-download-word-"]')
                    .should("have.length.greaterThan", 0)
                    .first()
                    .should("have.attr", "href");
            }
        });

        it("GP sees PDF and Word links in unit report card", () => {
            visitDashboardAs("admin_user");

            cy.visit("/dashboard/unit/1000");
            cy.getByCy("tab-reports").click();

            cy.get('[data-cy^="btn-report-download-pdf-"]', { timeout: 10000 })
                .should("have.length.greaterThan", 0)
                .first()
                .should("have.attr", "href");

            cy.get('[data-cy^="btn-report-download-word-"]')
                .should("have.length.greaterThan", 0)
                .first()
                .should("have.attr", "href");
        });

        it("unit manager sees only PDF link (no Word) in unit report card", () => {
            visitDashboardAs("unit_manager_user");

            cy.visit("/dashboard/unit/1000");
            cy.getByCy("tab-reports").click();

            cy.get('[data-cy^="btn-report-download-pdf-"]', { timeout: 10000 })
                .should("have.length.greaterThan", 0)
                .first()
                .should("have.attr", "href");

            cy.get('[data-cy^="btn-report-download-word-"]').should("not.exist");
        });
    });
});
