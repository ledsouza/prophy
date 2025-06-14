import { OperationStatus, OperationType } from "@/enums";
import {
    APIDeleteResponse,
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
    user: UserDTO | number | null;
    client: number;
};

export type UnitOperationDTO = UnitDTO &
    Operation & {
        original_unit?: number;
    };

type PutUnitOperationDTO = Partial<
    Omit<UnitOperationDTO, "id" | "users" | "operation_type" | "original_unit">
>;

const unitApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
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
        listAllUnitsOperations: builder.query<UnitOperationDTO[], void>({
            async queryFn(_arg, _queryApi, _extraOptions, baseQuery) {
                let allUnitsOperations: UnitOperationDTO[] = [];
                let currentPage = 1;
                let hasNextPage = true;

                while (hasNextPage) {
                    const response = await baseQuery({
                        url: "units/operations/",
                        method: "GET",
                        params: { page: currentPage },
                    });

                    if (response.error) return { error: response.error };

                    const data = response.data as PaginatedResponse<UnitOperationDTO>;
                    allUnitsOperations = [...allUnitsOperations, ...data.results];
                    hasNextPage = data.next !== null;
                    currentPage++;
                }

                return { data: allUnitsOperations };
            },
            providesTags: [{ type: "UnitOperation", id: "LIST" }],
        }),
        createAddUnitOperation: builder.mutation<
            UnitOperationDTO,
            Omit<UnitOperationDTO, "id" | "user" | "operation_type" | "operation_status">
        >({
            query: (unitData) => ({
                url: "units/operations/",
                method: "POST",
                body: {
                    ...unitData,
                    operation_type: OperationType.ADD,
                },
            }),
            invalidatesTags: [
                { type: "UnitOperation", id: "LIST" },
                { type: "Unit", id: "LIST" },
            ],
        }),
        createEditUnitOperation: builder.mutation<
            UnitOperationDTO,
            Omit<UnitOperationDTO, "id" | "user" | "operation_type" | "operation_status">
        >({
            query: (unitData) => ({
                url: "units/operations/",
                method: "POST",
                body: {
                    ...unitData,
                    operation_type: OperationType.EDIT,
                },
            }),
            invalidatesTags: [
                { type: "UnitOperation", id: "LIST" },
                { type: "Unit", id: "LIST" },
            ],
        }),
        createDeleteUnitOperation: builder.mutation<UnitOperationDTO, Number>({
            query: (unitID) => ({
                url: "units/operations/",
                method: "POST",
                body: {
                    original_unit: unitID,
                    operation_type: OperationType.DELETE,
                },
            }),
            invalidatesTags: [
                { type: "UnitOperation", id: "LIST" },
                { type: "Unit", id: "LIST" },
            ],
        }),
        deleteUnitOperation: builder.mutation<APIDeleteResponse, number>({
            query: (unitId) => ({
                url: `units/operations/${unitId}/`,
                method: "DELETE",
            }),
            invalidatesTags: [
                { type: "UnitOperation", id: "LIST" },
                { type: "Unit", id: "LIST" },
            ],
        }),
        createUnit: builder.mutation<
            UnitOperationDTO,
            Omit<UnitOperationDTO, "id" | "user" | "status" | "operation_type" | "operation_status">
        >({
            query: (unitData) => ({
                url: "units/operations/",
                method: "POST",
                body: {
                    ...unitData,
                    operation_type: OperationType.ADD,
                    operation_status: OperationStatus.ACCEPTED,
                },
            }),
            invalidatesTags: [
                { type: "UnitOperation", id: "LIST" },
                { type: "Unit", id: "LIST" },
            ],
        }),
        updateUnit: builder.mutation<
            UnitOperationDTO,
            {
                unitID: number;
                unitData: PutUnitOperationDTO;
            }
        >({
            query: ({ unitID, unitData }) => ({
                url: `units/operations/${unitID}/`,
                method: "PUT",
                body: unitData,
            }),
            invalidatesTags: [
                { type: "UnitOperation", id: "LIST" },
                { type: "Unit", id: "LIST" },
            ],
        }),
    }),
});

export const {
    useListUnitsQuery,
    useListAllUnitsQuery,
    useListAllUnitsOperationsQuery,
    useCreateAddUnitOperationMutation,
    useCreateEditUnitOperationMutation,
    useCreateDeleteUnitOperationMutation,
    useDeleteUnitOperationMutation,
    useCreateUnitMutation,
    useUpdateUnitMutation,
} = unitApiSlice;
