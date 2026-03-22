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
            cy.fixture("proposals.json").then((data) => {
                const cnpj: string = data.rejected_cnpj;

                visitDashboardAs("comercial_user");
                cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "C");

                cy.getByCy("commercial-tab-proposals").click();

                cy.getByCy("proposals-filter-cnpj").clear().type(cnpj);
                cy.getByCy("proposals-apply-filters").click();

                cy.getByCy("proposal-edit-modal").should("not.exist");

                if (viewport.isMobile) {
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
