import {
    apiSlice,
    ListQueryParams,
    PaginatedResponse,
} from "../services/apiSlice";
import { UserDTO } from "./authApiSlice";

export type UnitDTO = {
    id: number;
    name: string;
    cnpj: string;
    email: string;
    phone: string;
    address: string;
    state: string;
    city: string;
    user: Pick<UserDTO, "name" | "role" | "email" | "phone">;
    client: number;
};

const unitApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        listUnits: builder.query<PaginatedResponse<UnitDTO>, ListQueryParams>({
            query: ({ page = 1 }) => ({
                url: "units/",
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
        createUnit: builder.mutation<UnitDTO, Omit<UnitDTO, "id" | "user">>({
            query: (unitData) => ({
                url: "units/",
                method: "POST",
                body: unitData,
            }),
        }),
    }),
});

export const { useListUnitsQuery, useCreateUnitMutation } = unitApiSlice;
