import {
    apiSlice,
    ListQueryParams,
    Operation,
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

type UnitOperationDTO = UnitDTO & Operation;

const unitApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createUnit: builder.mutation<
            UnitOperationDTO,
            Omit<UnitOperationDTO, "id" | "user">
        >({
            query: (unitData) => ({
                url: "units/operations/",
                method: "POST",
                body: unitData,
            }),
            invalidatesTags: [
                { type: "UnitOperation", id: "LIST" },
                { type: "Unit", id: "LIST" },
            ],
        }),
        deleteUnitOperation: builder.mutation<void, number>({
            query: (unitId) => ({
                url: `units/operations/${unitId}`,
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "UnitOperation", id: "LIST" }],
        }),
        listUnits: builder.query<PaginatedResponse<UnitDTO>, ListQueryParams>({
            query: ({ page = 1 }) => ({
                url: "units/",
                method: "GET",
                params: { page },
            }),
            providesTags: (result) =>
                result
                    ? [
                          ...result.results.map(({ id }) => ({
                              type: "Unit" as const,
                              id,
                          })),
                          { type: "Unit", id: "LIST" },
                      ]
                    : [{ type: "Unit", id: "LIST" }],
        }),
        listAllUnits: builder.query<UnitDTO[], void>({
            async queryFn(_arg, _queryApi, _extraOptions, baseQuery) {
                let allUnits: UnitDTO[] = [];
                let currentPage = 1;
                let hasNextPage = true;

                while (hasNextPage) {
                    const response = await baseQuery({
                        url: "units/",
                        method: "GET",
                        params: { page: currentPage },
                    });

                    if (response.error) return { error: response.error };

                    const data = response.data as PaginatedResponse<UnitDTO>;
                    allUnits = [...allUnits, ...data.results];
                    hasNextPage = data.next !== null;
                    currentPage++;
                }

                return { data: allUnits };
            },
            providesTags: [{ type: "Unit", id: "LIST" }],
        }),
    }),
});

export const {
    useCreateUnitMutation,
    useDeleteUnitOperationMutation,
    useListUnitsQuery,
    useListAllUnitsQuery,
} = unitApiSlice;
