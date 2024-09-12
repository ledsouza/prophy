import { CNPJForm } from "@/components/forms";

describe("CNPJForm", () => {
    it("renders the form correctly", () => {
        const onSubmit = cy.stub();
        cy.mount(<CNPJForm onSubmit={onSubmit} />);

        cy.getByTestId("title").should(
            "contain",
            "Insira o CNPJ da sua instituição"
        );
        cy.getByTestId("input-cnpj").should("exist");
        cy.getByTestId("button-submit").should("exist");
    });

    it("displays an error for invalid CNPJ", () => {
        const onSubmit = cy.stub();
        cy.mount(<CNPJForm onSubmit={onSubmit} />);

        cy.getByTestId("input-cnpj").type("12345678901234");
        cy.getByTestId("button-submit").click();
        cy.getByTestId("validation-error").should(
            "contain",
            "Digite um CNPJ válido"
        );
    });

    it("displays an error for CNPJ with incorrect length", () => {
        const onSubmit = cy.stub();
        cy.mount(<CNPJForm onSubmit={onSubmit} />);

        cy.getByTestId("input-cnpj").type("123456");
        cy.getByTestId("button-submit").click();
        cy.getByTestId("validation-error").should(
            "contain",
            "O CNPJ deve conter 14 caracteres"
        );
    });

    it("submits the form with a valid CNPJ", () => {
        const onSubmit = cy.stub();
        cy.mount(<CNPJForm onSubmit={onSubmit} />);

        cy.getByTestId("input-cnpj").type("97892835000135");
        cy.getByTestId("button-submit").click();
        cy.wrap(onSubmit).should("have.been.calledWith", "97892835000135");
    });
});
