import EditProposalForm from "@/components/forms/EditProposalForm";
import { ContractType, ProposalStatus } from "@/enums";

describe("EditProposalForm (component)", () => {
    it("renders and submits", () => {
        cy.mount(
            <EditProposalForm
                title="Editar Proposta"
                description="Atualize os dados da proposta comercial abaixo."
                proposal={{
                    id: 1,
                    date: "2025-01-01",
                    cnpj: "00000000000100",
                    city: "São Paulo",
                    state: "SP",
                    contact_name: "Contato",
                    contact_phone: "11999999999",
                    email: "contato@example.com",
                    value: "1000.00",
                    contract_type: ContractType.ANNUAL,
                    status: ProposalStatus.PENDING,
                    pdf_version: null,
                    word_version: null,
                }}
            />
        );

        cy.getByCy("proposal-edit-modal").should("exist");
        cy.getByCy("proposal-edit-submit").should("exist");
    });
});
