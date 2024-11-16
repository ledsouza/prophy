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

export const { useListEquipmentsQuery } = equipmentApiSlice;
