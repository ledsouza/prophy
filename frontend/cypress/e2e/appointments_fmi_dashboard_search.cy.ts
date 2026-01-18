describe("appointments - FMI dashboard search", () => {
    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("internal_physicist_user");
    });

    it("shows appointments tab and allows creating appointments", () => {
        cy.visit("/dashboard?tab=appointments");
        cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "FMI");

        cy.contains("Agendamentos").click();

        cy.getByCy("fmi-appointments-results").should("exist");
        cy.getByCy("fmi-appointments-create-appointment").should("exist");
    });
});
