import {
    DESKTOP_VIEWPORT,
    MOBILE_VIEWPORT,
    describeForViewports,
    visitDashboardAs,
} from "../support/e2eTestUtils";

describe("commercial - proposals smoke", () => {
    beforeEach(() => {
        cy.setupDB();
    });

    describeForViewports([DESKTOP_VIEWPORT, MOBILE_VIEWPORT], (viewport) => {
        it("filters proposals by CNPJ and edits the first result", () => {
            cy.intercept({
                method: "GET",
                pathname: "**/proposals/",
                query: { cnpj: "*" },
            }).as("filteredProposals");

            cy.fixture("proposals.json").then((data) => {
                const cnpj: string = data.rejected_cnpj;

                visitDashboardAs("comercial_user");
                cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "C");

                cy.getByCy("commercial-tab-proposals").click();

                cy.getByCy("proposals-filter-cnpj").clear().type(cnpj);
                cy.getByCy("proposals-apply-filters").click();

                // Without this the click can land on an unfiltered row
                // that React is about to replace.
                cy.wait("@filteredProposals");

                cy.getByCy("proposal-edit-modal").should("not.exist");

                if (viewport.isMobile) {
                    cy.get('[data-cy^="proposal-card-"]').should(
                        "have.length.greaterThan",
                        0,
                    );
                }

                cy.get('[data-cy^="proposal-edit-"]')
                    .filterRendered()
                    .first()
                    .click();

                cy.getByCy("proposal-edit-modal").should("exist");
                cy.getByCy("modal-scroll-container").scrollTo("bottom");
                cy.getByCy("proposal-edit-submit").click({ force: true });

                cy.getByCy("proposal-edit-modal").should("not.exist");
            });
        });
    });
});
