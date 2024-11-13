import {
    apiSlice,
    ListQueryParams,
    PaginatedResponse,
} from "../services/apiSlice";

export type UnitDTO = {
    id: number;
    name: string;
    cnpj: string;
    email: string;
    phone: string;
    address: string;
    state: string;
    city: string;
    user: number;
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
