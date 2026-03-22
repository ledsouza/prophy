import {
    DESKTOP_VIEWPORT,
    MOBILE_VIEWPORT,
    describeForViewports,
    type ViewportConfig,
} from "../support/e2eTestUtils";

function getAppointmentIdFromConfirmButton(
    subjectAlias: string,
): Cypress.Chainable<string> {
    return cy
        .get(subjectAlias)
        .scrollIntoView()
        .find('[data-cy^="appointment-confirm-"]')
        .first()
        .invoke("attr", "data-cy")
        .then((dataCy) => {
            const appointmentId = dataCy?.replace("appointment-confirm-", "");

            expect(appointmentId, "appointment id extracted from confirm button").to.be.a(
                "string",
            );
            expect(appointmentId, "appointment id extracted from confirm button").not.to.be
                .empty;

            return appointmentId as string;
        });
}

function getAppointmentActionContainerCy(
    appointmentId: string,
    viewport: ViewportConfig,
): string {
    if (viewport.isMobile) {
        return `appointment-mobile-actions-${appointmentId}`;
    }

    return `appointment-desktop-actions-${appointmentId}`;
}

function getAppointmentAction(
    appointmentId: string,
    actionPrefix: string,
    viewport: ViewportConfig,
): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
        .getByCy(`appointment-card-${appointmentId}`)
        .scrollIntoView()
        .within(() => {
            cy.getByCy(getAppointmentActionContainerCy(appointmentId, viewport))
                .find(`[data-cy="${actionPrefix}-${appointmentId}"]`)
                .should("have.length", 1);
        })
        .getByCy(getAppointmentActionContainerCy(appointmentId, viewport))
        .find(`[data-cy="${actionPrefix}-${appointmentId}"]`)
        .should("have.length", 1);
}

function confirmAppointment(appointmentId: string, viewport: ViewportConfig): void {
    getAppointmentAction(appointmentId, "appointment-confirm", viewport)
        .scrollIntoView()
        .should("be.visible")
        .click();
    cy.getByCy("appointment-confirm-submit")
        .scrollIntoView()
        .should("be.visible")
        .click();
}

describe("appointments - GP actions", () => {
    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("admin_user");
    });

    describeForViewports([DESKTOP_VIEWPORT, MOBILE_VIEWPORT], (viewport) => {
        it("confirms and cancels an appointment from unit details", () => {
            cy.fixture("default-units.json").then((units) => {
                cy.visit(`/dashboard/unit/${units.unit1.id}`);
                cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");

                cy.getByCy("tab-appointments").click();
                cy.get('[data-cy^="appointment-card-"]')
                    .filter(':has([data-cy^="appointment-confirm-"])')
                    .first()
                    .as("confirmableAppointment");

                getAppointmentIdFromConfirmButton("@confirmableAppointment").then((appointmentId) => {
                    confirmAppointment(appointmentId, viewport);

                    getAppointmentAction(appointmentId, "appointment-cancel", viewport)
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

                    getAppointmentIdFromConfirmButton("@serviceOrderAppointment").then(
                        (appointmentId) => {
                            confirmAppointment(appointmentId, viewport);

                            getAppointmentAction(
                                appointmentId,
                                "appointment-create-service-order",
                                viewport,
                            )
                                .scrollIntoView()
                                .should("be.visible")
                                .click();
                        },
                    );

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
                    cy.get("@serviceOrderAppointment").within(() => {
                        cy.get('[data-cy^="appointment-create-service-order-"]').should(
                            "not.exist",
                        );
                    });
                });
            });
        });
    });
});
