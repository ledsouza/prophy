import {
    apiSlice,
    ListQueryParams,
    Operation,
    PaginatedResponse,
} from "../services/apiSlice";
import { UserDTO } from "./authApiSlice";

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
    users?: Pick<UserDTO, "name" | "role" | "email" | "phone">[];
};

export type ClientOperationDTO = ClientDTO & Operation;

type Status = {
    status: boolean;
};

const clientApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        verifyProposalStatus: builder.mutation<Status, ClientDTO["cnpj"]>({
            query: (cnpj) => ({
                url: "proposals/status/",
                method: "POST",
                body: { cnpj },
            }),
        }),
        verifyClientStatus: builder.mutation<Status, ClientDTO["cnpj"]>({
            query: (cnpj) => ({
                url: "clients/status/",
                method: "POST",
                body: { cnpj },
            }),
        }),
        createClient: builder.mutation<
            ClientOperationDTO,
            Omit<ClientOperationDTO, "id" | "status">
        >({
            query: (clientData) => ({
                url: "clients/operations/",
                method: "POST",
                body: clientData,
            }),
            invalidatesTags: [
                { type: "ClientOperation", id: "LIST" },
                { type: "Client", id: "LIST" },
            ],
        }),
        deleteClientOperation: builder.mutation<void, number>({
            query: (clientId) => ({
                url: `clients/operations/${clientId}`,
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "ClientOperation", id: "LIST" }],
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
            providesTags: (result) =>
                result
                    ? [
                          ...result.results.map(({ id }) => ({
                              type: "Client" as const,
                              id,
                          })),
                          { type: "Client", id: "LIST" },
                      ]
                    : [{ type: "Client", id: "LIST" }],
        }),
        listClientsOperations: builder.query<
            PaginatedResponse<ClientOperationDTO>,
            ListQueryParams
        >({
            query: ({ page = 1 }) => ({
                url: "clients/operations/",
                method: "GET",
                params: { page },
            }),
            providesTags: (result) =>
                result
                    ? [
                          ...result.results.map(({ id }) => ({
                              type: "ClientOperation" as const,
                              id,
                          })),
                          { type: "ClientOperation", id: "LIST" },
                      ]
                    : [{ type: "ClientOperation", id: "LIST" }],
        }),
    }),
});

export const {
    useVerifyProposalStatusMutation,
    useVerifyClientStatusMutation,
    useCreateClientMutation,
    useDeleteClientOperationMutation,
    useGetByCnpjQuery,
    useListClientsQuery,
    useListClientsOperationsQuery,
} = clientApiSlice;
