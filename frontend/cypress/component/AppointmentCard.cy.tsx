import AppointmentCard from "@/components/client/AppointmentCard";
import AppointmentStatus from "@/enums/AppointmentStatus";
import AppointmentType from "@/enums/AppointmentType";

describe("AppointmentCard (component)", () => {
    const appointment = {
        id: 1,
        date: "2025-01-01T10:00:00Z",
        type: AppointmentType.ONLINE,
        status: AppointmentStatus.PENDING,
        contact_name: "Contato",
        contact_phone: "11999999999",
        client_name: "Cliente",
        unit: 1,
        unit_name: "Unidade",
        unit_full_address: "Rua X, 123",
        service_order: null,
        justification: null,
    };

    beforeEach(() => {
        cy.viewport(390, 844);
        cy.intercept("GET", "**/users/me/**", {
            statusCode: 200,
            body: { id: 1, role: "GP" },
        });
    });

    it("renders basic appointment info", () => {
        cy.mount(<AppointmentCard appointment={appointment} />);

        cy.get('[data-cy^="appointment-card-"]').should("exist");
        cy.getByCy("appointment-confirm-submit").should("not.exist");
    });

    it("stacks action buttons with mobile tap targets", () => {
        cy.mount(<AppointmentCard appointment={appointment} />);

        cy.get("[data-testid=btn-appointment-confirm]")
            .should("be.visible")
            .should("have.class", "min-h-10")
            .should("have.class", "w-full");

        cy.get("[data-testid=btn-appointment-cancel-schedule]")
            .should("be.visible")
            .should("have.class", "h-10")
            .should("have.class", "w-full");
    });

    it("renders a status badge for mobile header", () => {
        cy.mount(<AppointmentCard appointment={appointment} />);

        cy.get("[data-testid=appointment-status-badge]")
            .should("be.visible")
            .should("contain.text", "Pendente");
    });
});
