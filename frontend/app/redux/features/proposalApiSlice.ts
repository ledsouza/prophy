import { ContractType, ProposalStatus } from "@/enums";
import { apiSlice, ListQueryParams, PaginatedResponse } from "../services/apiSlice";

export type ProposalDTO = {
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
};

type ListProposalsParams = ListQueryParams & {
    cnpj?: string;
    contact_name?: string;
    contract_type?: string;
    status?: string;
    expiring_annual?: string;
};

export type CreateProposalPayload = {
    cnpj: string;
    state: string;
    city: string;
    contact_name: string;
    contact_phone: string;
    email: string;
    date: string;
    value: string;
    contract_type: ContractType;
};

export type UpdateProposalPayload = Partial<CreateProposalPayload>;

const proposalApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        listProposals: builder.query<PaginatedResponse<ProposalDTO>, ListProposalsParams>({
            query: ({ page = 1, ...filters }) => {
                return {
                    url: "proposals/",
                    method: "GET",
                    params: {
                        page,
                        ...filters,
                    },
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
        listAllProposals: builder.query<ProposalDTO[], void>({
            async queryFn(_arg, _queryApi, _extraOptions, baseQuery) {
                let allProposals: ProposalDTO[] = [];
                let currentPage = 1;
                let hasNextPage = true;

                while (hasNextPage) {
                    const response = await baseQuery({
                        url: "proposals/",
                        method: "GET",
                        params: { page: currentPage },
                    });

                    if (response.error) return { error: response.error };

                    const data = response.data as PaginatedResponse<ProposalDTO>;
                    allProposals = [...allProposals, ...data.results];
                    hasNextPage = data.next !== null;
                    currentPage++;
                }

                return { data: allProposals };
            },
            providesTags: [{ type: "Proposal", id: "LIST" }],
        }),
        createProposal: builder.mutation<ProposalDTO, CreateProposalPayload>({
            query: (data) => ({
                url: "proposals/",
                method: "POST",
                body: data,
            }),
            invalidatesTags: [
                { type: "Proposal", id: "LIST" },
                { type: "Client", id: "LIST" },
            ],
        }),
        updateProposal: builder.mutation<ProposalDTO, { id: number; data: UpdateProposalPayload }>({
            query: ({ id, data }) => ({
                url: `proposals/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "Proposal", id },
                { type: "Proposal", id: "LIST" },
                { type: "Client", id: "LIST" },
            ],
        }),
    }),
});

export const {
    useListProposalsQuery,
    useListAllProposalsQuery,
    useCreateProposalMutation,
    useUpdateProposalMutation,
} = proposalApiSlice;
