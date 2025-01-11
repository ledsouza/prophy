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

export type EquipmentOperationDTO = EquipmentDTO & Operation;

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
        createEquipmentOperation: builder.mutation<
            EquipmentOperationDTO,
            FormData
        >({
            query: (formData) => ({
                url: "equipments/operations/",
                method: "POST",
                body: formData,
                formData: true,
            }),
            invalidatesTags: [
                { type: "EquipmentOperation", id: "LIST" },
                { type: "Equipment", id: "LIST" },
            ],
        }),
    }),
});

export const {
    useListEquipmentsQuery,
    useListAllEquipmentsQuery,
    useCreateEquipmentOperationMutation,
} = equipmentApiSlice;
