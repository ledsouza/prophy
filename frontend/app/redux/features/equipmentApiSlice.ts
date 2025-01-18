import { OperationType } from "@/enums";
import {
    apiSlice,
    ListQueryParams,
    Operation,
    PaginatedResponse,
} from "../services/apiSlice";

export type EquipmentDTO = {
    id: number;
    modality: string;
    manufacturer: string;
    model: string;
    series_number?: string;
    anvisa_registry?: string;
    equipment_photo?: string;
    label_photo?: string;
    maintenance_responsable?: string;
    email_maintenance_responsable?: string;
    phone_maintenance_responsable?: string;
    unit: number;
};

export type EquipmentOperationDTO = EquipmentDTO &
    Operation & {
        original_equipment?: number;
    };

const equipmentApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        listEquipments: builder.query<
            PaginatedResponse<EquipmentDTO>,
            ListQueryParams
        >({
            query: ({ page = 1 }) => ({
                url: "equipments/",
                method: "GET",
                params: { page },
            }),
            providesTags: (result) =>
                result
                    ? [
                          ...result.results.map(({ id }) => ({
                              type: "Equipment" as const,
                              id,
                          })),
                          { type: "Equipment", id: "LIST" },
                      ]
                    : [{ type: "Equipment", id: "LIST" }],
        }),
        listAllEquipments: builder.query<EquipmentDTO[], void>({
            async queryFn(_arg, _queryApi, _extraOptions, baseQuery) {
                let allEquipments: EquipmentDTO[] = [];
                let currentPage = 1;
                let hasNextPage = true;

                while (hasNextPage) {
                    const response = await baseQuery({
                        url: "equipments/",
                        method: "GET",
                        params: { page: currentPage },
                    });

                    if (response.error) return { error: response.error };

                    const data =
                        response.data as PaginatedResponse<EquipmentDTO>;
                    allEquipments = [...allEquipments, ...data.results];
                    hasNextPage = data.next !== null;
                    currentPage++;
                }

                return { data: allEquipments };
            },
            providesTags: [{ type: "Equipment", id: "LIST" }],
        }),
        listAllEquipmentsOperations: builder.query<
            EquipmentOperationDTO[],
            void
        >({
            async queryFn(_arg, _queryApi, _extraOptions, baseQuery) {
                let allEquipmentsOperations: EquipmentOperationDTO[] = [];
                let currentPage = 1;
                let hasNextPage = true;

                while (hasNextPage) {
                    const response = await baseQuery({
                        url: "equipments/operations/",
                        method: "GET",
                        params: { page: currentPage },
                    });

                    if (response.error) return { error: response.error };

                    const data =
                        response.data as PaginatedResponse<EquipmentOperationDTO>;
                    allEquipmentsOperations = [
                        ...allEquipmentsOperations,
                        ...data.results,
                    ];
                    hasNextPage = data.next !== null;
                    currentPage++;
                }

                return { data: allEquipmentsOperations };
            },
            providesTags: [{ type: "EquipmentOperation", id: "LIST" }],
        }),
        createAddEquipmentOperation: builder.mutation<
            EquipmentOperationDTO,
            FormData
        >({
            query: (formData) => {
                formData.append("operation_type", OperationType.ADD);
                return {
                    url: "equipments/operations/",
                    method: "POST",
                    body: formData,
                    formData: true,
                };
            },
            invalidatesTags: [
                { type: "EquipmentOperation", id: "LIST" },
                { type: "Equipment", id: "LIST" },
            ],
        }),
        createEditEquipmentOperation: builder.mutation<
            EquipmentOperationDTO,
            FormData
        >({
            query: (formData) => {
                formData.append("operation_type", OperationType.EDIT);
                return {
                    url: "equipments/operations/",
                    method: "POST",
                    body: formData,
                    formData: true,
                };
            },
            invalidatesTags: [
                { type: "EquipmentOperation", id: "LIST" },
                { type: "Equipment", id: "LIST" },
            ],
        }),
        createDeleteEquipmentOperation: builder.mutation<
            EquipmentOperationDTO,
            Number
        >({
            query: (equipmentID) => ({
                url: "equipments/operations/",
                method: "POST",
                body: {
                    original_equipment: equipmentID,
                    operation_type: OperationType.DELETE,
                },
            }),
            invalidatesTags: [{ type: "EquipmentOperation", id: "LIST" }],
        }),
        deleteEquipmentOperation: builder.mutation<void, number>({
            query: (equipmentId) => ({
                url: `equipments/operations/${equipmentId}`,
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "EquipmentOperation", id: "LIST" }],
        }),
    }),
});

export const {
    useListEquipmentsQuery,
    useListAllEquipmentsQuery,
    useListAllEquipmentsOperationsQuery,
    useCreateAddEquipmentOperationMutation,
    useCreateEditEquipmentOperationMutation,
    useCreateDeleteEquipmentOperationMutation,
    useDeleteEquipmentOperationMutation,
} = equipmentApiSlice;
