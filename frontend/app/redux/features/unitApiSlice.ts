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
