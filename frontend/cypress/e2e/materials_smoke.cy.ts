import { ROLE_USERS } from "../support/roleUsers";
import {
    DESKTOP_VIEWPORT,
    MOBILE_VIEWPORT,
    applyViewport,
    describeForViewports,
    visitDashboardAs,
} from "../support/e2eTestUtils";

describe("materials - smoke", () => {
    beforeEach(() => {
        cy.setupDB();
    });

    describeForViewports([DESKTOP_VIEWPORT, MOBILE_VIEWPORT], (viewport) => {
        for (const user of ROLE_USERS) {
            it(`opens /dashboard/materials for ${user}`, () => {
                visitDashboardAs(user, "/dashboard/materials");

                cy.getByCy("dashboard-root").should("exist");
                cy.getByCy("materials-results").should("exist");

                if (!viewport.isMobile) {
                    cy.getByCy("materials-results").find("table").should("exist");
                    return;
                }

                cy.get("body").then(($body) => {
                    const mobileCards = $body.find('[data-cy^="material-card-"]');

                    if (mobileCards.length > 0) {
                        cy.get('[data-cy^="material-card-"]')
                            .should("have.length.greaterThan", 0)
                            .first()
                            .should("be.visible");
                        cy.getByCy("materials-results")
                            .find("table")
                            .should("not.be.visible");
                        return;
                    }

                    cy.getByCy("materials-results").should(
                        "contain",
                        "Nenhum material encontrado com os filtros aplicados",
                    );
                });
            });
        }
    });

    it("renders material cards and actions for prophy manager on mobile", () => {
        applyViewport(MOBILE_VIEWPORT.value);
        visitDashboardAs("admin_user", "/dashboard/materials");

        cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");
        cy.getByCy("materials-results").should("exist");

        cy.get('[data-cy^="material-card-"]')
            .should("have.length.greaterThan", 0)
            .first()
            .within(() => {
                cy.contains("Baixar").should("be.visible");
                cy.contains("Editar").should("be.visible");
                cy.contains("Excluir").should("be.visible");
            });
    });
});
