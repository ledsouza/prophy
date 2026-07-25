import {
    DESKTOP_VIEWPORT,
    MOBILE_VIEWPORT,
    describeForViewports,
} from "../support/e2eTestUtils";

describe("equipment details - image zoom", () => {
    beforeEach(() => {
        cy.setupDB();
    });

    describeForViewports([DESKTOP_VIEWPORT, MOBILE_VIEWPORT], () => {
        beforeEach(() => {
            cy.loginAs("unit_manager_user");
            cy.visit("/dashboard/unit/1000");

            cy.get('[data-testid^="equipment-card-"]', { timeout: 10000 })
                .first()
                .within(() => {
                    cy.get('[data-testid="btn-details"]').click();
                });

            cy.get('[data-testid="equipment-details"]').should("be.visible");
        });

        // The desktop and mobile layouts are both present in the DOM at
        // once (toggled via responsive `hidden`/`sm:hidden` classes), so
        // every selector below must filter down to the copy that isn't
        // CSS-hidden at the current viewport - see filterRendered() in
        // cypress/support/commands.ts for why `:visible` doesn't work
        // here (it also excludes elements merely scrolled out of the
        // modal's scrollable area).

        it("opens and closes the lightbox from the main equipment photo", () => {
            cy.getByCy("equipment-photo-zoom-trigger").filterRendered().click();
            cy.get('[aria-label="Ampliar"]').should("be.visible");

            cy.get("body").type("{esc}");
            cy.get('[aria-label="Ampliar"]').should("not.exist");
        });

        it("opens the lightbox from the equipment label photo", () => {
            cy.getByCy("equipment-label-photo-zoom-trigger").filterRendered().click();
            cy.get('[aria-label="Ampliar"]').should("be.visible");
        });

        it("opens the lightbox from an accessory photo and its label photo", () => {
            cy.get('button:contains("Acessórios")').filterRendered().click();

            cy.get('[data-cy^="accessory-photo-zoom-trigger-"]')
                .filterRendered()
                .first()
                .click();
            cy.get('[aria-label="Ampliar"]').should("be.visible");
            cy.get("body").type("{esc}");
            cy.get('[aria-label="Ampliar"]').should("not.exist");

            cy.get('[data-cy^="accessory-label-photo-zoom-trigger-"]')
                .filterRendered()
                .first()
                .click();
            cy.get('[aria-label="Ampliar"]').should("be.visible");
        });
    });
});
