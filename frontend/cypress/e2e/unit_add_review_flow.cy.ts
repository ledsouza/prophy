import { fake } from "validation-br/dist/cnpj";

import {
    DESKTOP_VIEWPORT,
    MOBILE_VIEWPORT,
    describeForViewports,
} from "../support/e2eTestUtils";

describe("Unit add review flow", () => {
    const registeredClientName = "Hospital de Clínicas de Porto Alegre";
    const registeredClientCnpj = "78187773000116";
    const acceptedUnitName = "Nova Unidade Aceita E2E";
    const rejectedUnitName = "Nova Unidade Rejeitada E2E";
    beforeEach(() => {
        cy.setupDB();
    });

    function selectRequesterClient() {
        cy.get('[data-cy="client-options"] button', { timeout: 10000 }).click();
        cy.getByCy("client-options-options")
            .should("be.visible")
            .contains(registeredClientName)
            .click();
        cy.get('[data-cy="client-options"]').should("contain", registeredClientName);
    }

    function requestUnitAdd(unitName: string) {
        const cnpjValue = fake();

        cy.loginAs("client_user");
        cy.visit("/dashboard");
        selectRequesterClient();

        cy.get('[data-testid="btn-add-unit"]', { timeout: 10000 }).click();
        cy.get('[data-testid="unit-name-input"]', { timeout: 10000 }).type(unitName);
        cy.get('[data-testid="unit-cnpj-input"]').type(cnpjValue);
        cy.get('[data-testid="unit-email-input"]').type(
            `unit-${cnpjValue}@example.com`
        );
        cy.get('[data-testid="unit-phone-input"]').type("11999999999");
        cy.get('[data-testid="unit-state-input"] input')
            .click()
            .type("São Paulo{enter}");
        cy.get('[data-testid="unit-city-input"] input')
            .click()
            .type("São Paulo{enter}");
        cy.get('[data-testid="unit-address-input"]').type("Rua da Unidade, 100");
        cy.get('[data-testid="submit-btn"]').click();

        cy.contains("Requisição enviada com sucesso.").should("be.visible");
    }

    function openReviewerClientDetails(isMobileViewport: boolean) {
        cy.loginAs("internal_physicist_user");
        cy.visit("/dashboard?tab=clients");

        cy.getByCy("fmi-clients-filter-cnpj").clear().type(registeredClientCnpj);
        cy.getByCy("fmi-clients-apply-filters").click();
        cy.getByCy("fmi-clients-results").should("contain", registeredClientName);

        if (isMobileViewport) {
            cy.get('[data-cy^="fmi-client-card-"]')
                .contains(registeredClientName)
                .closest('[data-cy^="fmi-client-card-"]')
                .within(() => {
                    cy.get('[data-cy^="fmi-client-details-mobile-"]').click();
                });
            return;
        }

        cy.getByCy("fmi-clients-results")
            .find('[data-cy^="fmi-client-row-"]')
            .contains(registeredClientName)
            .closest('[data-cy^="fmi-client-row-"]')
            .within(() => {
                cy.get('[data-cy^="fmi-client-details-"]:visible').click();
            });
    }

    function openRequestedUnitCard(unitName: string) {
        cy.contains('[data-testid^="unit-card-"]', unitName, { timeout: 10000 })
            .scrollIntoView()
            .should("be.visible")
            .within(() => {
                cy.get('[data-testid="btn-review-operation"]', { timeout: 10000 }).click();
            });
    }

    function getUnitCard(unitName: string) {
        return cy
            .contains('[data-testid^="unit-card-"]', unitName, { timeout: 10000 })
            .scrollIntoView()
            .should("be.visible");
    }

    describeForViewports([DESKTOP_VIEWPORT, MOBILE_VIEWPORT], (viewport) => {
        it("allows the responsible physicist to accept a new unit request", () => {
            requestUnitAdd(acceptedUnitName);

            openReviewerClientDetails(viewport.isMobile);
            openRequestedUnitCard(acceptedUnitName);

            cy.getByCy("review-add-unit-form").should("exist");
            cy.getByCy("review-edit-diff-modal").should("not.exist");

            cy.get('[data-testid="unit-name-input"]').clear().type(`${acceptedUnitName} Revisada`);
            cy.get('[data-testid="unit-address-input"]').clear().type("Rua Revisada, 200");

            cy.get('[data-testid="submit-btn"]').scrollIntoView().should("be.visible").click();

            cy.loginAs("client_user");
            cy.visit("/dashboard");
            selectRequesterClient();
            getUnitCard(`${acceptedUnitName} Revisada`).within(() => {
                cy.contains("Aprovada").scrollIntoView().should("be.visible");
            });
        });

        it("allows the responsible physicist to reject a new unit request", () => {
            requestUnitAdd(rejectedUnitName);

            openReviewerClientDetails(viewport.isMobile);
            openRequestedUnitCard(rejectedUnitName);

            cy.getByCy("review-add-unit-form").should("exist");
            cy.getByCy("review-edit-diff-modal").should("not.exist");

            cy.get('[data-testid="reject-btn"]').scrollIntoView().click();
            cy.getByCy("review-add-rejection-note-input")
                .should("be.visible")
                .type("Dados da unidade inconsistentes");
            cy.get('[data-testid="submit-rejection-btn"]').should("be.visible").click();

            cy.loginAs("client_user");
            cy.visit("/dashboard");
            selectRequesterClient();
            getUnitCard(rejectedUnitName).within(() => {
                cy.contains("Verificar motivo")
                    .scrollIntoView()
                    .should("be.visible")
                    .click();
            });
            cy.contains("Notas do Físico Médico Responsável").should("be.visible");
            cy.contains("Dados da unidade inconsistentes").should("be.visible");
        });
    });
});