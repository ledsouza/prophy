import {
    apiSlice,
    ListQueryParams,
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
            ClientDTO,
            Omit<ClientDTO, "status" | "id">
        >({
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
            serializeQueryArgs: ({ endpointName }) => {
                return endpointName;
            },
            merge: (currentCache, newItems) => {
                if (!currentCache) return newItems;

                // Merge current cache with new results, ensuring no duplicates
                return {
                    count: newItems.count,
                    next: newItems.next,
                    previous: newItems.previous,
                    results: [
                        ...currentCache.results,
                        ...newItems.results.filter(
                            (newItem) =>
                                !currentCache.results.some(
                                    (existingItem) =>
                                        existingItem.id === newItem.id
                                )
                        ),
                    ],
                };
            },
            forceRefetch: ({ currentArg, previousArg }) => {
                return currentArg?.page !== previousArg?.page;
            },
        }),
    }),
});

export const {
    useVerifyProposalStatusMutation,
    useVerifyClientStatusMutation,
    useCreateClientMutation,
    useGetByCnpjQuery,
    useListClientsQuery,
} = clientApiSlice;
