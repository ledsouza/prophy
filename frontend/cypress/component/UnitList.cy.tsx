import UnitList from "@/components/client/UnitList";
import { OperationStatus, OperationType } from "@/enums";

type PaginatedResponse<T> = {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
};

describe("UnitList (component)", () => {
    const acceptedUnit = {
        id: 1,
        name: "Unidade Aceita",
        cnpj: "12345678000190",
        email: "aceita@example.com",
        phone: "11999999999",
        address: "Rua A, 10",
        state: "SP",
        city: "São Paulo",
        user: null,
        client: 10,
    };

    const pendingAddOperation = {
        id: 2,
        name: "Unidade Em Análise",
        cnpj: "10987654000190",
        email: "analise@example.com",
        phone: "11888888888",
        address: "Rua B, 20",
        state: "SP",
        city: "Campinas",
        user: null,
        client: 10,
        operation_type: OperationType.ADD,
        operation_status: OperationStatus.REVIEW,
    };

    const emptyPaginatedResponse: PaginatedResponse<never> = {
        count: 0,
        next: null,
        previous: null,
        results: [],
    };

    beforeEach(() => {
        cy.intercept("GET", "**/users/me/**", {
            statusCode: 200,
            body: { id: 1, role: "GGC" },
        });
        cy.intercept("GET", "**/equipments/**", {
            statusCode: 200,
            body: emptyPaginatedResponse,
        });
        cy.intercept("GET", "**/equipments/operations/**", {
            statusCode: 200,
            body: emptyPaginatedResponse,
        });
        cy.intercept("GET", "**/units/operations/**", {
            statusCode: 200,
            body: {
                count: 1,
                next: null,
                previous: null,
                results: [pendingAddOperation],
            },
        });
    });

    it("renders pending add unit operations even when there is no accepted base unit", () => {
        cy.mount(
            <UnitList searchedUnits={[acceptedUnit]} filteredUnits={[acceptedUnit]} />
        );

        cy.get("[data-testid='unit-card-1']").should("exist");
        cy.get("[data-testid='unit-card-2']").should("exist");
        cy.contains("Unidade Em Análise").should("be.visible");
        cy.contains("Pendente").should("be.visible");
        cy.get("[data-testid='btn-review-operation']").should("not.exist");
        cy.get("[data-testid='btn-cancel-operation']").should("be.visible");
    });

    it("shows review action only for reviewer roles", () => {
        cy.intercept("GET", "**/users/me/**", {
            statusCode: 200,
            body: { id: 1, role: "FMI" },
        });

        cy.mount(<UnitList searchedUnits={[]} filteredUnits={[]} />);

        cy.get("[data-testid='unit-card-2']").should("exist");
        cy.get("[data-testid='btn-review-operation']").should("be.visible");
        cy.get("[data-testid='btn-cancel-operation']").should("not.exist");
    });
});