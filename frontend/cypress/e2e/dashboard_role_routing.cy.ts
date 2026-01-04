const ROLE_USERS = [
    "admin_user",
    "client_user",
    "unit_manager_user",
    "comercial_user",
    "external_physicist_user",
    "internal_physicist_user",
] as const;

describe("dashboard routing", () => {
    before(() => {
        cy.setupDB();
    });

    for (const user of ROLE_USERS) {
        it(`opens /dashboard for ${user}`, () => {
            cy.loginAs(user);
            cy.visit("/dashboard");

            cy.url().should("include", "/dashboard");
            cy.getByCy("dashboard-root").should("exist");
            cy.getByCy("dashboard-root")
                .should("have.attr", "data-cy-role")
                .and("match", /^(GP|GGC|GU|C|FMI|FME)$/);
        });
    }
});
