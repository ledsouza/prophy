import {
    apiSlice,
    ListQueryParams,
    PaginatedResponse,
} from "../services/apiSlice";

export type EquipmentDTO = {
    id: number;
    modality: string;
    manufacturer: string;
    model: string;
    series_number: string;
    anvisa_registry: string;
    equipment_photo: string;
    label_photo: string;
    maintenance_responsable: string;
    email_maintenance_responsable: string;
    phone_maintenance_responsable: string;
    unit: number;
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
        }),
    }),
});

export const { useListEquipmentsQuery } = equipmentApiSlice;
