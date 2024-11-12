import {
    apiSlice,
    ListQueryParams,
    PaginatedResponse,
} from "../services/apiSlice";
import { User } from "./authApiSlice";

export type ClientDTO = {
    id: number;
    cnpj: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    state: string;
    city: string;
    status: string;
    users?: Pick<User, "name" | "role">[];
};

type ProposalStatus = {
    approved: boolean;
};

const clientApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        verifyProposalStatus: builder.mutation<
            ProposalStatus,
            ClientDTO["cnpj"]
        >({
            query: (cnpj) => ({
                url: "proposals/status/",
                method: "POST",
                body: { cnpj },
            }),
        }),
        createClient: builder.mutation<void, Omit<ClientDTO, "status" | "id">>({
            query: (clientData) => ({
                url: "clients/",
                method: "POST",
                body: clientData,
            }),
        }),
        getByCnpj: builder.query<
            PaginatedResponse<ClientDTO>,
            { cnpj: ClientDTO["cnpj"] } & ListQueryParams
        >({
            query: ({ cnpj, page = 1 }) => ({
                url: `clients/`,
                method: "GET",
                params: { cnpj, page },
            }),
        }),
        listClients: builder.query<
            PaginatedResponse<ClientDTO>,
            ListQueryParams
        >({
            query: ({ page = 1 }) => ({
                url: "clients/",
                method: "GET",
                params: { page },
            }),
        }),
    }),
});

export const {
    useVerifyProposalStatusMutation,
    useCreateClientMutation,
    useGetByCnpjQuery,
    useListClientsQuery,
} = clientApiSlice;
