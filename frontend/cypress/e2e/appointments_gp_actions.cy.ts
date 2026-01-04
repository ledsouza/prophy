describe("appointments - GP actions", () => {
    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("admin_user");
    });

    it("confirms and cancels an appointment from unit details", () => {
        cy.fixture("default-units.json").then((units) => {
            cy.visit(`/dashboard/unit/${units.unit1.id}`);
            cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");

            cy.getByCy("tab-appointments").click();

            cy.get('[data-cy^="appointment-card-"]')
                .filter(':has([data-cy^="appointment-confirm-"])')
                .first()
                .as("confirmableAppointment");

            cy.get("@confirmableAppointment")
                .find('[data-cy^="appointment-confirm-"]')
                .first()
                .click();
            cy.getByCy("appointment-confirm-submit").click();

            cy.get("@confirmableAppointment")
                .find('[data-cy^="appointment-cancel-"]')
                .first()
                .click();
            cy.getByCy("appointment-cancel-submit").click();
        });
    });
});
