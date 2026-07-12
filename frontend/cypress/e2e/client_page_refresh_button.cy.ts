import { visitDashboardAs } from "../support/e2eTestUtils";

describe("client page - Atualizar button", () => {
    const registeredClientCnpj = "78187773000116";

    beforeEach(() => {
        cy.setupDB();
    });

    it("shows an info toast when there is nothing new to refresh", () => {
        visitDashboardAs("admin_user", `/dashboard/client/${registeredClientCnpj}`);

        cy.getByCy("gp-update-data-btn", { timeout: 10000 })
            .should("not.be.disabled")
            .click();

        cy.contains("Nenhuma atualização encontrada.").should("be.visible");
    });

    it("shows an error toast when the refresh request fails", () => {
        visitDashboardAs("admin_user", `/dashboard/client/${registeredClientCnpj}`);

        cy.getByCy("gp-update-data-btn", { timeout: 10000 }).should("not.be.disabled");
        cy.intercept("GET", "**/api/units/**", { statusCode: 500 }).as("failedRefresh");

        cy.getByCy("gp-update-data-btn").click();

        cy.contains("Erro no servidor. Tente novamente mais tarde.").should("be.visible");
    });

    it("shows a success toast when new data is found on the server", () => {
        cy.loginAs("admin_user");
        cy.visit(`/dashboard/client/${registeredClientCnpj}`);

        cy.get('[data-testid^="unit-card-"]', { timeout: 10000 })
            .first()
            .invoke("attr", "data-testid")
            .then((testId) => {
                const unitId = Number((testId as string).replace("unit-card-", ""));
                const apiUrl =
                    (Cypress.expose("apiUrl") as string | undefined) ||
                    "http://localhost:8000/api";
                const base = apiUrl.replace(/\/$/, "");

                // Bypasses the page's own RTK Query cache entirely (unlike
                // a UI-driven mutation, which would self-invalidate and
                // leave nothing "new" for the refresh button to find).
                cy.request({
                    method: "POST",
                    url: `${base}/units/operations/`,
                    body: {
                        original_unit: unitId,
                        operation_type: "D",
                    },
                });
            });

        cy.getByCy("gp-update-data-btn", { timeout: 10000 })
            .should("not.be.disabled")
            .click();

        cy.contains("Dados atualizados com sucesso!").should("be.visible");
    });
});
