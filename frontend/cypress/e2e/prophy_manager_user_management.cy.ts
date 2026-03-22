import { generate } from "gerador-validador-cpf";
import {
    DESKTOP_VIEWPORT,
    MOBILE_VIEWPORT,
    describeForViewports,
} from "../support/e2eTestUtils";

describe("prophy manager - user management", () => {
    beforeEach(() => {
        cy.setupDB();
    });

    const TOAST_TIMEOUT_MS = 10_000;

    const selectRole = (fieldCy: string, roleLabel: string) => {
        cy.getByCy(fieldCy).find("button").click();
        cy.getByCy(`${fieldCy}-options`)
            .contains('[role="option"]', roleLabel)
            .scrollIntoView()
            .click();
        cy.getByCy(fieldCy).should("contain", roleLabel);
    };

    const goToLastPage = () => {
        const clickNextIfEnabled = () => {
            cy.getByCy("gp-users-results").then(($results) => {
                const $nav = $results.find('[aria-label="Pagination Navigation"]');
                if ($nav.length === 0) {
                    return;
                }

                const $nextBtn = $nav
                    .find('button[aria-label="Go to next page"]')
                    .filter(":visible");

                if ($nextBtn.length === 0 || $nextBtn.is(":disabled")) {
                    return;
                }

                cy.wrap($nextBtn).click();
                cy.wait("@listManagedUsers");
                clickNextIfEnabled();
            });
        };

        clickNextIfEnabled();
    };

    describeForViewports([DESKTOP_VIEWPORT, MOBILE_VIEWPORT], (viewport) => {
        it("allows GP to create a user, edit their role, and toggle active", () => {
            cy.loginAs("admin_user");

            cy.intercept("GET", "**/api/users/manage/**").as("listManagedUsers");
            cy.intercept("POST", "**/api/users/manage/").as("createManagedUser");
            cy.intercept("PATCH", "**/api/users/manage/*/").as("updateManagedUser");

            cy.visit("/dashboard/users", { failOnStatusCode: false });

            cy.location("pathname").should("include", "/dashboard/users");
            cy.getByCy("gp-users-page", { timeout: 20000 }).should("exist");

            const cpf = generate();
            const runId = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
            const userName = `Cypress User ${runId}`;
            const userEmail = `cypress.user+${runId}@example.com`;
            const userPhone = `119${Math.floor(10000000 + Math.random() * 90000000)}`;

            cy.getByCy("gp-users-open-create").click();
            cy.getByCy("gp-users-create-modal").should("exist");

            cy.getByCy("gp-users-create-cpf").type(cpf);
            cy.getByCy("gp-users-create-name").type(userName);
            cy.getByCy("gp-users-create-email").type(userEmail);
            cy.getByCy("gp-users-create-phone").type(userPhone);
            selectRole("gp-users-create-role", "Gerente Prophy");
            cy.getByCy("gp-users-create-submit").click();

            cy.wait("@createManagedUser")
                .its("response.statusCode")
                .should("be.oneOf", [200, 201]);
            cy.wait("@listManagedUsers");

            cy.contains("Usuário criado e e-mail de definição de senha enviado.", {
                timeout: TOAST_TIMEOUT_MS,
            }).should("be.visible");

            cy.getByCy("gp-users-results").should("exist");

            goToLastPage();

            cy.getByCy("gp-users-results")
                .contains(userName, { timeout: 20000 })
                .should("exist");

            cy.getByCy("gp-users-results")
                .find(
                    viewport.isMobile
                        ? '[data-cy^="gp-users-card-"]'
                        : '[data-cy^="gp-users-row-"]',
                )
                .contains(userName)
                .closest(
                    viewport.isMobile
                        ? '[data-cy^="gp-users-card-"]'
                        : '[data-cy^="gp-users-row-"]',
                )
                .invoke("attr", "data-cy")
                .then((entryCy) => {
                    const expectedPattern = viewport.isMobile
                        ? /^gp-users-card-\d+$/
                        : /^gp-users-row-\d+$/;

                    expect(entryCy).to.match(expectedPattern);

                    const id = entryCy!
                        .replace("gp-users-row-", "")
                        .replace("gp-users-card-", "");

                    cy.getByCy(`gp-users-${viewport.isMobile ? "card" : "row"}-${id}`).within(
                        () => {
                            cy.getByCy(`gp-users-edit-${id}`).should("be.visible").click();
                        },
                    );

                    cy.getByCy("gp-users-edit-modal").should("exist");

                    selectRole("gp-users-edit-role", "Gerente Prophy");

                    cy.getByCy("gp-users-edit-submit").click();

                    cy.wait("@updateManagedUser");
                    cy.wait("@listManagedUsers");

                    cy.contains("Usuário atualizado com sucesso.", {
                        timeout: TOAST_TIMEOUT_MS,
                    }).should("be.visible");

                    cy.getByCy(`gp-users-${viewport.isMobile ? "card" : "row"}-${id}`).within(
                        () => {
                            cy.contains("Gerente Prophy").should("exist");
                        },
                    );

                    cy.getByCy(`gp-users-${viewport.isMobile ? "card" : "row"}-${id}`).within(
                        () => {
                            cy.getByCy(`gp-users-deactivate-${id}`)
                                .should("be.visible")
                                .click();
                        },
                    );
                    cy.getByCy("gp-users-toggle-active-modal").should("exist");
                    cy.getByCy("gp-users-toggle-active-confirm").click();

                    cy.contains("Usuário inativado com sucesso.", {
                        timeout: TOAST_TIMEOUT_MS,
                    }).should("be.visible");

                    cy.getByCy(`gp-users-${viewport.isMobile ? "card" : "row"}-${id}`).within(
                        () => {
                            cy.contains(viewport.isMobile ? "Inativo" : "Não").should(
                                "exist",
                            );
                        },
                    );

                    cy.getByCy(`gp-users-${viewport.isMobile ? "card" : "row"}-${id}`).within(
                        () => {
                            cy.getByCy(`gp-users-activate-${id}`)
                                .should("be.visible")
                                .click();
                        },
                    );
                    cy.getByCy("gp-users-toggle-active-modal").should("exist");
                    cy.getByCy("gp-users-toggle-active-confirm").click();

                    cy.contains("Usuário ativado com sucesso.", {
                        timeout: TOAST_TIMEOUT_MS,
                    }).should("be.visible");

                    cy.getByCy(`gp-users-${viewport.isMobile ? "card" : "row"}-${id}`).within(
                        () => {
                            cy.contains(viewport.isMobile ? "Ativo" : "Sim").should(
                                "exist",
                            );
                        },
                    );
                });
        });
    });

    it("denies non-GP users from accessing the page", () => {
        cy.loginAs("comercial_user");
        cy.visit("/dashboard/users", { failOnStatusCode: false });

        cy.location("pathname").should("not.eq", "/dashboard/users");
    });
});
