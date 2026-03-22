describe("Review edit modals", () => {
    const viewports: Array<Cypress.ViewportPreset | [number, number]> = [[1440, 900], "iphone-6"];
    const desktopBreakpoint = 640;
    const registeredClientName = "Hospital de Clínicas de Porto Alegre";
    const registeredClientCnpj = "78187773000116";
    const registeredClientRoute = "/dashboard/client/78187773000116";
    const targetUnitId = 1000;
    const targetUnitRoute = "/dashboard/unit/1000/";
    const rejectedClientName = "Hospital de Clínicas de Porto Alegre Revisado";
    const acceptedUnitName = "Cardiologia Aceita";

    beforeEach(() => {
        cy.setupDB();
    });

    function applyViewport(viewport: Cypress.ViewportPreset | [number, number]) {
        if (Array.isArray(viewport)) {
            cy.viewport(viewport[0], viewport[1]);
            return;
        }

        cy.viewport(viewport);
    }

    function requestClientEdit(newName: string) {
        cy.loginAs("client_user");
        cy.visit("/dashboard");

        selectRequesterClient();

        cy.get('[data-testid="btn-edit-client"]', { timeout: 10000 }).click();
        cy.get('[data-testid="institution-name-input"]', { timeout: 10000 })
            .clear()
            .type(newName);
        cy.get('[data-testid="submit-btn"]').click();
    }

    function selectRequesterClient() {
        cy.get('[data-cy="client-options"] button', { timeout: 10000 }).click();
        cy.getByCy("client-options-options")
            .should("be.visible")
            .contains(registeredClientName)
            .click();
        cy.get('[data-cy="client-options"]').should("contain", registeredClientName);
    }

    function openTargetUnitDetails() {
        cy.get(`[data-testid="unit-card-${targetUnitId}"]`, { timeout: 10000 }).within(() => {
            cy.get('[data-testid="btn-details"]').click();
        });
    }

    function requestUnitEdit(newName: string) {
        cy.loginAs("client_user");
        cy.visit("/dashboard");
        selectRequesterClient();
        openTargetUnitDetails();

        cy.get('[data-testid="btn-edit-unit"]', { timeout: 10000 }).click();
        cy.get('[data-testid="unit-name-input"]', { timeout: 10000 }).clear().type(newName);
        cy.get('[data-testid="submit-btn"]').click();
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
        } else {
            cy.getByCy("fmi-clients-results")
                .find('[data-cy^="fmi-client-row-"]')
                .contains(registeredClientName)
                .closest('[data-cy^="fmi-client-row-"]')
                .within(() => {
                    cy.get('[data-cy^="fmi-client-details-"]:visible').click();
                });
        }

        cy.location("pathname", { timeout: 10000 }).should(
            "match",
            /\/dashboard\/client\/78187773000116\/?$/,
        );
    }

    viewports.forEach((viewport) => {
        const isMobileViewport = Array.isArray(viewport)
            ? viewport[0] < desktopBreakpoint
            : viewport === "iphone-6";

        describe(`viewport ${Array.isArray(viewport) ? viewport.join("x") : viewport}`, () => {
            beforeEach(() => {
                applyViewport(viewport);
            });

            it("allows the responsible physicist to reject a client edit request", () => {
                requestClientEdit(rejectedClientName);

                openReviewerClientDetails(isMobileViewport);

                cy.get('[data-testid="btn-review-edit-client"]', { timeout: 10000 }).click();

                cy.getByCy("review-edit-diff-modal").should("exist");
                cy.getByCy("review-diff-changed-field")
                    .should("have.length.at.least", 1)
                    .first()
                    .scrollIntoView()
                    .should("be.visible");
                cy.getByCy("review-reject-btn").scrollIntoView().click();
                cy.getByCy("review-rejection-note-input")
                    .should("be.visible")
                    .type("Dados divergentes para revisão");
                cy.getByCy("review-rejection-submit-btn").should("be.visible").click();

                cy.loginAs("client_user");
                cy.visit("/dashboard");
                selectRequesterClient();
                cy.contains("Verificar motivo").should("be.visible").click();
                cy.contains("Notas do Físico Médico Responsável").should("be.visible");
                cy.contains("Dados divergentes para revisão").should("be.visible");

                cy.window().then((win) => {
                    const root = win.document.documentElement;
                    expect(root.scrollWidth).to.be.at.most(root.clientWidth);
                });
            });

            it("allows the responsible physicist to accept a unit edit request", () => {
                requestUnitEdit(acceptedUnitName);

                openReviewerClientDetails(isMobileViewport);
                openTargetUnitDetails();

                cy.get('[data-testid="btn-review-unit-operation"]', { timeout: 10000 }).click();

                cy.getByCy("review-edit-diff-modal").should("exist");
                cy.getByCy("review-diff-changed-field")
                    .should("have.length.at.least", 1)
                    .first()
                    .scrollIntoView()
                    .should("be.visible");

                if (isMobileViewport) {
                    cy.getByCy("review-edit-diff-modal").then(($modal) => {
                        const rect = $modal[0].getBoundingClientRect();
                        expect(Math.round(rect.left)).to.be.at.least(0);
                        expect(Math.round(rect.right)).to.be.at.most(
                            Cypress.config("viewportWidth"),
                        );
                    });
                }

                cy.getByCy("review-accept-btn").scrollIntoView().should("be.visible").click();

                cy.loginAs("admin_user");
                cy.visit(targetUnitRoute);
                cy.contains(acceptedUnitName).should("be.visible");

                cy.window().then((win) => {
                    const root = win.document.documentElement;
                    expect(root.scrollWidth).to.be.at.most(root.clientWidth);
                });
            });
        });
    });
});