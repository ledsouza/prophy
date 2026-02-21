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
            cy.getByCy("appointment-confirm-submit").scrollIntoView().should("be.visible").click();

            cy.get("@confirmableAppointment")
                .find('[data-cy^="appointment-cancel-"]')
                .first()
                .click();
            cy.getByCy("appointment-cancel-submit").scrollIntoView().should("be.visible").click();
        });
    });

    it("creates a service order for a confirmed appointment", () => {
        cy.fixture("default-units.json").then((units) => {
            cy.fixture("default-equipments.json").then((equipments) => {
                cy.visit(`/dashboard/unit/${units.unit1.id}`);
                cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");

                cy.getByCy("tab-appointments").click();

                cy.get('[data-cy^="appointment-card-"]')
                    .filter(':has([data-cy^="appointment-confirm-"])')
                    .first()
                    .as("serviceOrderAppointment");

                cy.get("@serviceOrderAppointment")
                    .find('[data-cy^="appointment-confirm-"]')
                    .first()
                    .click();
                cy.getByCy("appointment-confirm-submit")
                    .scrollIntoView()
                    .should("be.visible")
                    .click();

                cy.get("@serviceOrderAppointment").find("[data-testid=btn-done]").click();

                cy.getByCy("service-order-subject").type("Inspeção de rotina");
                cy.getByCy("service-order-description").type(
                    "Inspeção completa realizada com checklist padrão.",
                );
                cy.getByCy("service-order-conclusion").type("Equipamento aprovado para operação.");

                cy.getByCy("service-order-equipments-button").click();
                cy.getByCy(`service-order-equipments-option-${equipments.equipment1.id}`)
                    .scrollIntoView()
                    .click();

                cy.getByCy("service-order-submit").click();

                cy.contains("Ordem de Serviço criada").should("be.visible");
                cy.get("@serviceOrderAppointment")
                    .find("[data-testid=btn-done]")
                    .should("not.exist");
            });
        });
    });
});
