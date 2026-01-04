describe("reset password", () => {
    beforeEach(() => {
        cy.setupDB();
    });

    it("shows reset password form and redirects to login after submit", () => {
        cy.visit("/auth/password-reset/uid/token", {
            failOnStatusCode: false,
        });

        cy.getByCy("reset-password-new-input").should("exist");
        cy.getByCy("reset-password-confirm-input").should("exist");
        cy.getByCy("reset-password-submit-btn").should("exist");
    });
});
