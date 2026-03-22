import {
    DESKTOP_VIEWPORT,
    MOBILE_VIEWPORT,
    describeForViewports,
} from "../support/e2eTestUtils";

describe("appointments - GP actions", () => {
    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("admin_user");
    });

    describeForViewports([DESKTOP_VIEWPORT, MOBILE_VIEWPORT], (viewport) => {
        const actionsSelector = viewport.isMobile ? ".sm\\:hidden" : ".sm\\:flex";

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
                    .scrollIntoView()
                    .find('[data-cy^="appointment-confirm-"]')
                    .first()
                    .invoke("attr", "data-cy")
                    .then((dataCy) => {
                        const appointmentId = dataCy?.replace("appointment-confirm-", "");
                        cy.get(`[data-cy="appointment-card-${appointmentId}"]`)
                            .scrollIntoView()
                            .find(actionsSelector)
                            .first()
                            .should("be.visible")
                            .find('[data-cy^="appointment-confirm-"]')
                            .first()
                            .scrollIntoView()
                            .should("be.visible")
                            .click();
                        cy.getByCy("appointment-confirm-submit")
                            .scrollIntoView()
                            .should("be.visible")
                            .click();

                        cy.get(`[data-cy="appointment-card-${appointmentId}"]`)
                            .scrollIntoView()
                            .find(actionsSelector)
                            .first()
                            .should("be.visible")
                            .find('[data-cy^="appointment-cancel-"]')
                            .first()
                            .scrollIntoView()
                            .should("be.visible")
                            .click();
                        cy.getByCy("appointment-cancel-submit")
                            .scrollIntoView()
                            .should("be.visible")
                            .click();
                    });
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
                        .scrollIntoView()
                        .find('[data-cy^="appointment-confirm-"]')
                        .first()
                        .invoke("attr", "data-cy")
                        .then((dataCy) => {
                            const appointmentId = dataCy?.replace("appointment-confirm-", "");
                            cy.get(`[data-cy="appointment-card-${appointmentId}"]`)
                                .scrollIntoView()
                                .find(actionsSelector)
                                .first()
                                .should("be.visible")
                                .find('[data-cy^="appointment-confirm-"]')
                                .first()
                                .scrollIntoView()
                                .should("be.visible")
                                .click();
                            cy.getByCy("appointment-confirm-submit")
                                .scrollIntoView()
                                .should("be.visible")
                                .click();

                            cy.get(`[data-cy="appointment-card-${appointmentId}"]`)
                                .scrollIntoView()
                                .find(actionsSelector)
                                .first()
                                .should("be.visible")
                                .find('[data-testid="btn-done"]')
                                .first()
                                .scrollIntoView()
                                .should("be.visible")
                                .click();
                        });

                    cy.getByCy("service-order-subject").type("Inspeção de rotina");
                    cy.getByCy("service-order-description").type(
                        "Inspeção completa realizada com checklist padrão.",
                    );
                    cy.getByCy("service-order-conclusion").type(
                        "Equipamento aprovado para operação.",
                    );

                    cy.getByCy("service-order-equipments-button").click();
                    cy.getByCy(`service-order-equipments-option-${equipments.equipment1.id}`)
                        .scrollIntoView()
                        .click();
                    cy.get("body").type("{esc}");

                    cy.getByCy("service-order-submit")
                        .scrollIntoView()
                        .should("be.visible")
                        .click();

                    cy.contains("Ordem de Serviço criada").should("be.visible");
                    cy.get("@serviceOrderAppointment")
                        .find("[data-testid=btn-done]")
                        .should("not.exist");
                });
            });
        });
    });
});
