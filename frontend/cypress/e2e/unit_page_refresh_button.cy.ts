import { visitDashboardAs } from "../support/e2eTestUtils";

describe("unit page - Atualizar button refreshes reports", () => {
    beforeEach(() => {
        cy.setupDB();
    });

    it("re-fetches reports list when Atualizar is clicked", () => {
        cy.intercept("GET", "**/api/reports/**").as("listReports");

        visitDashboardAs("admin_user");
        cy.visit("/dashboard/unit/1000");

        cy.getByCy("tab-reports").click();
        cy.wait("@listReports");

        cy.getByCy("unit-page-refresh-btn").click();
        cy.wait("@listReports");
    });
});
