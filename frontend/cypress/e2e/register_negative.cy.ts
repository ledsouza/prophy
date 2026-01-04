describe("register - negative cases", () => {
    beforeEach(() => {
        cy.setupDB();
    });

    it("does not allow registration when latest proposal is rejected", () => {
        cy.fixture("proposals.json").then((data) => {
            const cnpj: unknown = data.rejected_cnpj;
            expect(cnpj, "fixture must contain rejected_cnpj").to.be.a("string");

            cy.visit("/auth/register");

            cy.getByCy("register-cnpj-input").type(cnpj as string);
            cy.getByCy("register-cnpj-submit").click();

            cy.getByCy("register-cpf-input").should("not.exist");
        });
    });

    it("does not allow registration when CNPJ has no proposals", () => {
        cy.fixture("no-proposal.json").then((data) => {
            const cnpj: unknown = data.no_proposal_cnpj;
            expect(cnpj, "fixture must contain no_proposal_cnpj").to.be.a("string");

            cy.visit("/auth/register");

            cy.getByCy("register-cnpj-input").type(cnpj as string);
            cy.getByCy("register-cnpj-submit").click();

            cy.getByCy("register-cpf-input").should("not.exist");
        });
    });
});
