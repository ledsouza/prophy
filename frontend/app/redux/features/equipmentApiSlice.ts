import { OperationType } from "@/enums";
import { forEach } from "lodash";
import { apiSlice, ListQueryParams, Operation, PaginatedResponse } from "../services/apiSlice";
import { createPaginatedQueryFn } from "../services/paginationHelpers";
import { ModalityDTO } from "./modalityApiSlice";

export type EquipmentDTO = {
    id: number;
    modality: ModalityDTO;
    manufacturer: string;
    model: string;
    series_number?: string;
    anvisa_registry?: string;
    equipment_photo?: string;
    label_photo?: string;
    channels?: string;
    official_max_load?: number;
    usual_max_load?: number;
    purchase_installation_date?: string;
    maintenance_responsable?: string;
    email_maintenance_responsable?: string;
    phone_maintenance_responsable?: string;
    unit: number;
    unit_name: string;
    client_name: string;
};

export type EquipmentOperationDTO = EquipmentDTO &
    Operation & {
        original_equipment?: number;
    };

const equipmentApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        listEquipments: builder.query<
            PaginatedResponse<EquipmentDTO>,
            ListQueryParams & {
                modality?: number;
                manufacturer?: string;
                client_name?: string;
            }
        >({
            query: ({ page = 1, modality, manufacturer, client_name }) => {
                const params: Record<string, any> = { page };
                if (modality) params.modality = modality;
                if (manufacturer) params.manufacturer = manufacturer;
                if (client_name) params.client_name = client_name;

                return {
                    url: "equipments/",
                    method: "GET",
                    params,
                };
            },
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
        getManufacturers: builder.query<{ manufacturers: string[] }, void>({
            query: () => ({
                url: "equipments/manufacturers/",
                method: "GET",
            }),
            providesTags: [{ type: "Equipment", id: "MANUFACTURERS" }],
        }),
        listAllEquipments: builder.query<EquipmentDTO[], void>({
            queryFn: createPaginatedQueryFn<EquipmentDTO>("equipments/"),
            providesTags: [{ type: "Equipment", id: "LIST" }],
        }),
        listAllEquipmentsOperations: builder.query<EquipmentOperationDTO[], void>({
            queryFn: createPaginatedQueryFn<EquipmentOperationDTO>("equipments/operations/"),
            providesTags: [{ type: "EquipmentOperation", id: "LIST" }],
        }),
        createAddEquipmentOperation: builder.mutation<EquipmentOperationDTO, FormData>({
            query: (formData) => {
                formData.append("operation_type", OperationType.ADD);

                let hasFile = false;
                forEach(Array.from(formData.entries()), ([_, value]) => {
                    if (value instanceof File) hasFile = true;
                });

                if (!hasFile) {
                    return {
                        url: "equipments/operations/",
                        method: "POST",
                        body: Object.fromEntries(formData),
                        headers: {
                            "Content-Type": "application/json",
                        },
                    };
                }
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
        createEditEquipmentOperation: builder.mutation<EquipmentOperationDTO, FormData>({
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
        createDeleteEquipmentOperation: builder.mutation<EquipmentOperationDTO, Number>({
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
                url: `equipments/operations/${equipmentId}/`,
                method: "DELETE",
            }),
            invalidatesTags: [
                { type: "EquipmentOperation", id: "LIST" },
                { type: "Equipment", id: "LIST" },
            ],
        }),
        editEquipment: builder.mutation<
            EquipmentOperationDTO,
            {
                equipmentID: number;
                equipmentData: FormData;
            }
        >({
            query: ({ equipmentID, equipmentData }) => ({
                url: `equipments/operations/${equipmentID}/`,
                method: "PUT",
                body: equipmentData,
                formData: true,
            }),
            invalidatesTags: [
                { type: "EquipmentOperation", id: "LIST" },
                { type: "Equipment", id: "LIST" },
                { type: "Accessory", id: "LIST" },
            ],
        }),
    }),
});

export const {
    useListEquipmentsQuery,
    useListAllEquipmentsQuery,
    useListAllEquipmentsOperationsQuery,
    useGetManufacturersQuery,
    useCreateAddEquipmentOperationMutation,
    useCreateEditEquipmentOperationMutation,
    useCreateDeleteEquipmentOperationMutation,
    useDeleteEquipmentOperationMutation,
    useEditEquipmentMutation,
} = equipmentApiSlice;
