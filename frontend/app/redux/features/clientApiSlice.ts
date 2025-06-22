import { OperationStatus, OperationType } from "@/enums";
import { apiSlice, ListQueryParams, Operation, PaginatedResponse } from "../services/apiSlice";
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
    users: Pick<UserDTO, "name" | "role" | "email" | "phone">[];
};

export type ClientOperationDTO = ClientDTO &
    Operation & {
        original_client?: number;
    };

type PutClientOperationDTO = Partial<
    Omit<
        ClientOperationDTO,
        "id" | "users" | "status" | "operation_type" | "cnpj" | "note" | "original_client"
    >
>;

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
            ListQueryParams & {
                cnpj?: string;
                name?: string;
                city?: string;
                user_role?: string;
                contract_type?: string;
                operation_status?: string;
            }
        >({
            query: ({ page = 1, cnpj, name, city, user_role, contract_type, operation_status }) => {
                const params: Record<string, any> = { page };
                if (cnpj) params.cnpj = cnpj;
                if (name) params.name = name;
                if (city) params.city = city;
                if (user_role) params.user_role = user_role;
                if (contract_type) params.contract_type = contract_type;
                if (operation_status) params.operation_status = operation_status;

                return {
                    url: "clients/",
                    method: "GET",
                    params,
                };
            },
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
        listAllClients: builder.query<ClientDTO[], void>({
            async queryFn(_arg, _queryApi, _extraOptions, baseQuery) {
                let allClients: ClientDTO[] = [];
                let currentPage = 1;
                let hasNextPage = true;

                while (hasNextPage) {
                    const response = await baseQuery({
                        url: "clients/",
                        method: "GET",
                        params: { page: currentPage },
                    });

                    if (response.error) return { error: response.error };

                    const data = response.data as PaginatedResponse<ClientDTO>;
                    allClients = [...allClients, ...data.results];
                    hasNextPage = data.next !== null;
                    currentPage++;
                }

                return { data: allClients };
            },
            providesTags: [{ type: "Client", id: "LIST" }],
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
        listAllClientsOperations: builder.query<ClientOperationDTO[], void>({
            async queryFn(_arg, _queryApi, _extraOptions, baseQuery) {
                let allClientsOperations: ClientOperationDTO[] = [];
                let currentPage = 1;
                let hasNextPage = true;

                while (hasNextPage) {
                    const response = await baseQuery({
                        url: "clients/operations/",
                        method: "GET",
                        params: { page: currentPage },
                    });

                    if (response.error) return { error: response.error };

                    const data = response.data as PaginatedResponse<ClientOperationDTO>;
                    allClientsOperations = [...allClientsOperations, ...data.results];
                    hasNextPage = data.next !== null;
                    currentPage++;
                }

                return { data: allClientsOperations };
            },
            providesTags: [{ type: "ClientOperation", id: "LIST" }],
        }),
        createAddClientOperation: builder.mutation<
            ClientOperationDTO,
            Omit<
                ClientOperationDTO,
                "id" | "users" | "status" | "operation_type" | "operation_status"
            >
        >({
            query: (clientData) => ({
                url: "clients/operations/",
                method: "POST",
                body: {
                    ...clientData,
                    operation_type: OperationType.ADD,
                },
            }),
            invalidatesTags: [
                { type: "ClientOperation", id: "LIST" },
                { type: "Client", id: "LIST" },
            ],
        }),
        createEditClientOperation: builder.mutation<
            ClientOperationDTO,
            Omit<
                ClientOperationDTO,
                "id" | "users" | "status" | "operation_type" | "operation_status"
            >
        >({
            query: (clientData) => ({
                url: "clients/operations/",
                method: "POST",
                body: {
                    ...clientData,
                    operation_type: OperationType.EDIT,
                },
            }),
            invalidatesTags: [
                { type: "ClientOperation", id: "LIST" },
                { type: "Client", id: "LIST" },
            ],
        }),
        createDeleteClientOperation: builder.mutation<ClientOperationDTO, Number>({
            query: (clientID) => ({
                url: "clients/operations/",
                method: "POST",
                body: {
                    original_client: clientID,
                    operation_type: OperationType.DELETE,
                },
            }),
            invalidatesTags: [
                { type: "ClientOperation", id: "LIST" },
                { type: "Client", id: "LIST" },
            ],
        }),
        deleteClientOperation: builder.mutation<void, number>({
            query: (clientId) => ({
                url: `clients/operations/${clientId}/`,
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "ClientOperation", id: "LIST" }],
        }),
        createClient: builder.mutation<
            ClientOperationDTO,
            Omit<
                ClientOperationDTO,
                "id" | "users" | "status" | "operation_type" | "operation_status"
            >
        >({
            query: (clientData) => ({
                url: "clients/operations/",
                method: "POST",
                body: {
                    ...clientData,
                    operation_type: OperationType.ADD,
                    operation_status: OperationStatus.ACCEPTED,
                },
            }),
            invalidatesTags: [
                { type: "ClientOperation", id: "LIST" },
                { type: "Client", id: "LIST" },
            ],
        }),
        editClient: builder.mutation<
            ClientOperationDTO,
            {
                clientID: number;
                clientData: PutClientOperationDTO;
            }
        >({
            query: ({ clientID, clientData }) => ({
                url: `clients/operations/${clientID}/`,
                method: "PUT",
                body: clientData,
            }),
            invalidatesTags: [
                { type: "ClientOperation", id: "LIST" },
                { type: "Client", id: "LIST" },
            ],
        }),
    }),
});

export const {
    useVerifyProposalStatusMutation,
    useVerifyClientStatusMutation,
    useDeleteClientOperationMutation,
    useGetByCnpjQuery,
    useListClientsQuery,
    useListAllClientsQuery,
    useListClientsOperationsQuery,
    useListAllClientsOperationsQuery,
    useCreateAddClientOperationMutation,
    useCreateEditClientOperationMutation,
    useCreateDeleteClientOperationMutation,
    useCreateClientMutation,
    useEditClientMutation,
} = clientApiSlice;
