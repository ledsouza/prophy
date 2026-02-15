import { ROLE_USERS } from "../support/roleUsers";

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

            if (user === "admin_user" || user === "comercial_user") {
                cy.getByCy("gp-users-nav").should("exist");
            } else {
                cy.getByCy("gp-users-nav").should("not.exist");
            }
        });
    }
});
