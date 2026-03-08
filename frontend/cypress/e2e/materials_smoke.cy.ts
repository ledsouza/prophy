import { ROLE_USERS } from "../support/roleUsers";

describe("materials - smoke", () => {
    beforeEach(() => {
        cy.setupDB();
    });

    for (const user of ROLE_USERS) {
        it(`opens /dashboard/materials for ${user} on desktop`, () => {
            cy.viewport(1280, 720);
            cy.loginAs(user);
            cy.visit("/dashboard/materials");

            cy.getByCy("dashboard-root").should("exist");
            cy.getByCy("materials-results").should("exist");
            cy.getByCy("materials-results").find("table").should("exist");
        });

        it(`opens /dashboard/materials for ${user} on mobile`, () => {
            cy.viewport("iphone-6");
            cy.loginAs(user);
            cy.visit("/dashboard/materials");

            cy.getByCy("dashboard-root").should("exist");
            cy.getByCy("materials-results").should("exist");

            cy.get("body").then(($body) => {
                const mobileCards = $body.find('[data-cy^="material-card-"]');

                if (mobileCards.length > 0) {
                    cy.get('[data-cy^="material-card-"]')
                        .should("have.length.greaterThan", 0)
                        .first()
                        .should("be.visible");
                    cy.getByCy("materials-results").find("table").should("not.be.visible");
                    return;
                }

                cy.getByCy("materials-results").should(
                    "contain",
                    "Nenhum material encontrado com os filtros aplicados",
                );
            });
        });
    }

    it("renders material cards and actions for prophy manager on mobile", () => {
        cy.viewport("iphone-6");
        cy.loginAs("admin_user");
        cy.visit("/dashboard/materials");

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
