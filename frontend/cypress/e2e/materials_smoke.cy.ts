import { ROLE_USERS } from "../support/roleUsers";

describe("materials - smoke", () => {
    before(() => {
        cy.setupDB();
    });

    for (const user of ROLE_USERS) {
        it(`opens /dashboard/materials for ${user}`, () => {
            cy.loginAs(user);
            cy.visit("/dashboard/materials");

            cy.getByCy("dashboard-root").should("exist");
            cy.getByCy("materials-results").should("exist");
        });
    }
});
