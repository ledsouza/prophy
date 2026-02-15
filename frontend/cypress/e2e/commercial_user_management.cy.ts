import { generate } from "gerador-validador-cpf";

describe("commercial - user management", () => {
    before(() => {
        cy.setupDB();
    });

    const TOAST_TIMEOUT_MS = 10_000;

    it("allows commercial to create and associate allowed roles only", () => {
        cy.loginAs("comercial_user");

        cy.intercept("GET", "**/api/users/manage/**").as("listManagedUsers");
        cy.intercept("POST", "**/api/users/manage/").as("createManagedUser");

        cy.visit("/dashboard/users", { failOnStatusCode: false });

        cy.location("pathname").should("include", "/dashboard/users");
        cy.get('[data-cy="gp-users-page"]', { timeout: 20000 }).should("exist");

        cy.getByCy("gp-users-open-create").click();
        cy.getByCy("gp-users-create-modal").should("exist");

        cy.getByCy("gp-users-create-role").click();
        cy.getByCy("gp-users-create-role-options")
            .contains("Gerente Geral de Cliente")
            .should("exist");
        cy.getByCy("gp-users-create-role-options").contains("Gerente de Unidade").should("exist");
        cy.getByCy("gp-users-create-role-options").contains("Gerente Prophy").should("not.exist");

        cy.get("body").type("{esc}");

        const cpf = generate();

        cy.getByCy("gp-users-create-cpf").type(cpf);
        cy.getByCy("gp-users-create-name").type("Commercial User");
        cy.getByCy("gp-users-create-email").type("commercial.user@example.com");
        cy.getByCy("gp-users-create-phone").type("11999999999");

        cy.getByCy("gp-users-create-role").click();
        cy.getByCy("gp-users-create-role-options").contains("Gerente Geral de Cliente").click();
        cy.get("body").type("{esc}");
        cy.getByCy("gp-users-create-submit").click();

        cy.wait("@createManagedUser");
        cy.wait("@listManagedUsers");

        cy.contains("Usuário criado e e-mail de definição de senha enviado.", {
            timeout: TOAST_TIMEOUT_MS,
        }).should("be.visible");

        cy.getByCy("gp-users-results").within(() => {
            cy.contains("Editar").should("not.exist");
            cy.contains("Inativar").should("not.exist");
            cy.contains("Ativar").should("not.exist");
            cy.contains("Associações").should("exist");
        });
    });
});
