import { generate } from "gerador-validador-cpf";

describe("prophy manager - user management", () => {
    before(() => {
        cy.setupDB();
    });

    const TOAST_TIMEOUT_MS = 10_000;

    const goToLastPage = () => {
        cy.getByCy("gp-users-results").then(($results) => {
            const hasPagination = $results.find('[aria-label="Pagination Navigation"]').length > 0;
            if (!hasPagination) {
                return;
            }

            cy.wrap($results)
                .find('[aria-label="Pagination Navigation"]')
                .contains("button", "Próximo")
                .as("nextBtn");

            const clickUntilDisabled = () => {
                cy.get("@nextBtn").then(($btn) => {
                    if ($btn.is(":disabled")) {
                        return;
                    }

                    cy.get("@nextBtn").click();
                    cy.wait("@listManagedUsers");
                    clickUntilDisabled();
                });
            };

            clickUntilDisabled();
        });
    };

    it("allows GP to create a user, edit their role, and toggle active", () => {
        cy.loginAs("admin_user");

        cy.intercept("GET", "**/api/users/manage/**").as("listManagedUsers");
        cy.intercept("POST", "**/api/users/manage/").as("createManagedUser");
        cy.intercept("PATCH", "**/api/users/manage/*/").as("updateManagedUser");

        cy.visit("/dashboard/users", { failOnStatusCode: false });

        cy.location("pathname").should("include", "/dashboard/users");
        cy.get('[data-cy="gp-users-page"]', { timeout: 20000 }).should("exist");

        const cpf = generate();

        cy.getByCy("gp-users-open-create").click();
        cy.getByCy("gp-users-create-modal").should("exist");

        cy.getByCy("gp-users-create-cpf").type(cpf);
        cy.getByCy("gp-users-create-name").type("Cypress User");
        cy.getByCy("gp-users-create-email").type("cypress.user@example.com");
        cy.getByCy("gp-users-create-phone").type("11999999999");
        cy.getByCy("gp-users-create-submit").click();

        cy.wait("@createManagedUser");
        cy.wait("@listManagedUsers");

        cy.contains("Usuário criado e e-mail de definição de senha enviado.", {
            timeout: TOAST_TIMEOUT_MS,
        }).should("be.visible");

        cy.getByCy("gp-users-results").should("exist");

        goToLastPage();

        cy.getByCy("gp-users-results").contains("Cypress User", { timeout: 20000 }).should("exist");

        cy.contains("Cypress User")
            .closest("tr")
            .within(() => {
                cy.contains("Editar").click();
            });

        cy.getByCy("gp-users-edit-modal").should("exist");

        // Select component is custom; we rely on opening and choosing by text.
        cy.getByCy("gp-users-edit-role").click();
        cy.contains("Gerente Prophy").click();

        cy.getByCy("gp-users-edit-submit").click();

        cy.wait("@updateManagedUser");
        cy.wait("@listManagedUsers");

        cy.contains("Usuário atualizado com sucesso.", {
            timeout: TOAST_TIMEOUT_MS,
        }).should("be.visible");

        cy.contains("Cypress User")
            .closest("tr")
            .within(() => {
                cy.contains("Gerente Prophy").should("exist");
            });

        // Deactivate
        cy.contains("Cypress User")
            .closest("tr")
            .invoke("attr", "data-cy")
            .then((rowCy) => {
                expect(rowCy).to.match(/^gp-users-row-\d+$/);
                const id = rowCy!.replace("gp-users-row-", "");

                cy.getByCy(`gp-users-deactivate-${id}`).click();
                cy.getByCy("gp-users-toggle-active-modal").should("exist");
                cy.getByCy("gp-users-toggle-active-confirm").click();

                cy.contains("Usuário inativado com sucesso.", {
                    timeout: TOAST_TIMEOUT_MS,
                }).should("be.visible");

                cy.getByCy(`gp-users-row-${id}`).within(() => {
                    cy.contains("Não").should("exist");
                });

                // Activate
                cy.getByCy(`gp-users-activate-${id}`).click();
                cy.getByCy("gp-users-toggle-active-modal").should("exist");
                cy.getByCy("gp-users-toggle-active-confirm").click();

                cy.contains("Usuário ativado com sucesso.", {
                    timeout: TOAST_TIMEOUT_MS,
                }).should("be.visible");

                cy.getByCy(`gp-users-row-${id}`).within(() => {
                    cy.contains("Sim").should("exist");
                });
            });
    });

    it("denies non-GP users from accessing the page", () => {
        cy.loginAs("comercial_user");
        cy.visit("/dashboard/users", { failOnStatusCode: false });

        cy.location("pathname").should("not.eq", "/dashboard/users");
    });
});
