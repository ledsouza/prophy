describe("appointments - FME dashboard search", () => {
    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("external_physicist_user");
    });

    it("shows appointments tab but does not allow creating appointments", () => {
        cy.visit("/dashboard?tab=appointments");
        cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "FME");

        cy.contains("Agendamentos").click();

        cy.getByCy("fme-appointments-results").should("exist");
        cy.getByCy("fme-appointments-create-appointment").should("not.exist");
    });
});
