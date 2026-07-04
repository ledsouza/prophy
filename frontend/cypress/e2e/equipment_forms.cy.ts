import {
    DESKTOP_VIEWPORT,
    MOBILE_VIEWPORT,
    describeForViewports,
} from "../support/e2eTestUtils";

describe("equipment forms", () => {
    beforeEach(() => {
        cy.setupDB();
    });

    describeForViewports([DESKTOP_VIEWPORT, MOBILE_VIEWPORT], () => {
        describe("edit form - file upload not required", () => {
            it("submits text-only changes without re-uploading photos", () => {
                cy.loginAs("unit_manager_user");
                cy.visit("/dashboard/unit/1000");

                cy.get('[data-testid^="equipment-card-"]', { timeout: 10000 })
                    .first()
                    .within(() => {
                        cy.get('[data-testid="btn-edit-operation"]').click();
                    });

                cy.get('[data-testid="equipment-manufacturer-input"]', { timeout: 10000 })
                    .should("be.visible")
                    .clear()
                    .type("Fabricante Atualizado Cypress");

                cy.getByCy("modal-scroll-container").scrollTo("bottom");
                cy.get('[data-testid="submit-btn"]').click({ force: true });

                cy.contains("Requisição enviada com sucesso", { timeout: 10000 }).should(
                    "be.visible",
                );
            });
        });

        describe("edit form - current photo indicator", () => {
            it("shows Ver imagem atual buttons without requiring photo upload", () => {
                cy.loginAs("internal_physicist_user");
                cy.visit("/dashboard/unit/1000");

                cy.get('[data-testid^="equipment-card-"]', { timeout: 10000 })
                    .first()
                    .within(() => {
                        cy.get('[data-testid="btn-edit-operation"]').click();
                    });

                cy.get('[data-testid="equipment-modality-select"]', { timeout: 10000 }).should(
                    "be.visible",
                );
                cy.getByCy("equipment-photo-view-btn").scrollIntoView().should("be.visible");
                cy.getByCy("equipment-label-view-btn").scrollIntoView().should("be.visible");
            });
        });

        describe("add form - informações adicionais section", () => {
            it("shows additional info section for internal physicist role", () => {
                cy.loginAs("internal_physicist_user");
                cy.visit("/dashboard/unit/1000");

                cy.get('[data-testid="btn-add-equipment"]', { timeout: 10000 }).click();

                cy.get('[data-testid="equipment-modality-select"]', { timeout: 10000 }).should(
                    "be.visible",
                );
                cy.getByCy("modal-scroll-container").scrollTo("bottom");
                cy.getByCy("equipment-additional-info-section").should("be.visible");
            });

            it("hides additional info section for unit manager role", () => {
                cy.loginAs("unit_manager_user");
                cy.visit("/dashboard/unit/1000");

                cy.get('[data-testid="btn-add-equipment"]', { timeout: 10000 }).click();

                cy.getByCy("equipment-additional-info-section").should("not.exist");
            });
        });
    });
});
