import AppointmentCard from "@/components/client/AppointmentCard";
import AppointmentStatus from "@/enums/AppointmentStatus";
import AppointmentType from "@/enums/AppointmentType";

describe("AppointmentCard (component)", () => {
    it("renders basic appointment info", () => {
        cy.mount(
            <AppointmentCard
                appointment={{
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
                }}
            />
        );

        cy.get('[data-cy^="appointment-card-"]').should("exist");
        cy.getByCy("appointment-confirm-submit").should("not.exist");
    });
});
