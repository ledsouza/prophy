import { ContractType, ProposalStatus } from "@/enums";
import { apiSlice, ListQueryParams, PaginatedResponse } from "../services/apiSlice";

export interface ProposalDTO {
    id: number;
    cnpj: string;
    state: string;
    city: string;
    contact_name: string;
    contact_phone: string;
    email: string;
    date: string; // ISO date string
    value: string; // Decimal as string
    contract_type: ContractType;
    status: ProposalStatus;
}

type ListProposalsParams = ListQueryParams & {
    cnpj?: string;
};

const proposalApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        listProposals: builder.query<PaginatedResponse<ProposalDTO>, ListProposalsParams>({
            query: ({ page = 1, cnpj }) => {
                const params: Record<string, any> = { page };
                if (cnpj) {
                    params.cnpj = cnpj;
                }

                return {
                    url: "proposals/",
                    method: "GET",
                    params,
                };
            },
            providesTags: (result) =>
                result
                    ? [
                          ...result.results.map(({ id }) => ({
                              type: "Proposal" as const,
                              id,
                          })),
                          { type: "Proposal", id: "LIST" },
                      ]
                    : [{ type: "Proposal", id: "LIST" }],
        }),
    }),
});

export const { useListProposalsQuery } = proposalApiSlice;
