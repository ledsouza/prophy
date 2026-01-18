describe("commercial - clients toggle status", () => {
    beforeEach(() => {
        cy.setupDB();
        cy.loginAs("comercial_user");
    });

    it("distributes search tabs equally", () => {
        cy.visit("/dashboard");

        cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "C");

        cy.getByCy("commercial-tab-clients").then(($clients) => {
            const clientsWidth = $clients[0].getBoundingClientRect().width;

            cy.getByCy("commercial-tab-proposals").then(($proposals) => {
                const proposalsWidth = $proposals[0].getBoundingClientRect().width;

                cy.getByCy("commercial-tab-appointments").then(($appointments) => {
                    const appointmentsWidth = $appointments[0].getBoundingClientRect().width;
                    const tolerance = 2;

                    expect(Math.abs(clientsWidth - proposalsWidth)).to.be.at.most(tolerance);
                    expect(Math.abs(clientsWidth - appointmentsWidth)).to.be.at.most(tolerance);
                });
            });
        });
    });

    it("toggles the first client active status", () => {
        cy.visit("/dashboard");
        cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "C");

        cy.getByCy("commercial-tab-clients").click();
        cy.getByCy("commercial-clients-results").should("exist");

        cy.getByCy("commercial-clients-results")
            .find('[data-cy^="commercial-toggle-client-"]')
            .first()
            .click();

        cy.getByCy("commercial-clients-results")
            .find('[data-cy^="commercial-toggle-client-"]')
            .first()
            .should("exist");
    });
});
