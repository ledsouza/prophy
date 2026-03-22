import {
    DESKTOP_VIEWPORT,
    MOBILE_VIEWPORT,
    applyViewport,
} from "../support/e2eTestUtils";

describe("appointments - GP calendar view", () => {
    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("admin_user");
        applyViewport(DESKTOP_VIEWPORT.value);
    });

    it("toggles to calendar view and persists in URL", () => {
        cy.visit("/dashboard?tab=appointments");
        cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");

        cy.getByCy("search-tab-appointments").click();

        cy.getByCy("gp-appointments-view-toggle-calendar").click();

        cy.location("search").should("include", "view=calendar");
        cy.location("search").should("include", "tab=appointments");
        cy.getByCy("gp-appointments-calendar").should("be.visible");
    });

    it("opens appointment details modal when clicking a calendar event", () => {
        cy.visit("/dashboard?tab=appointments&view=calendar");
        cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");

        cy.getByCy("search-tab-appointments").click();
        cy.getByCy("gp-appointments-calendar").should("be.visible");

        cy.getByCy("gp-appointments-calendar-event").first().click();

        cy.getByCy("gp-appointments-calendar-modal")
            .should("exist")
            .scrollIntoView()
            .should("be.visible");
    });

    it("keeps calendar view when applying filters", () => {
        cy.visit("/dashboard?tab=appointments&view=calendar");
        cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");

        cy.getByCy("search-tab-appointments").click();

        cy.getByCy("gp-appointments-apply-filters").click();

        cy.location("search").should("include", "view=calendar");
        cy.getByCy("gp-appointments-calendar").should("be.visible");
    });

    it("hides calendar view on mobile", () => {
        applyViewport(MOBILE_VIEWPORT.value);
        cy.visit("/dashboard?tab=appointments&view=calendar");
        cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");

        cy.getByCy("search-tab-appointments").click();

        cy.getByCy("gp-appointments-view-toggle-calendar").should("not.be.visible");
        cy.getByCy("gp-appointments-calendar").should("not.be.visible");
        cy.getByCy("gp-appointments-view-toggle-list").should("not.be.visible");
    });
});
