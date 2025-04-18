import { apiSlice } from "../services/apiSlice";
import { AccessoryType } from "./modalityApiSlice";

export type AccessoryDTO = {
    id: number;
    manufacturer: string;
    model: string;
    series_number: string;
    equipment_photo: string;
    label_photo: string;
    equipment: number;
    category: AccessoryType;
};

const accessoryApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createAccessory: builder.mutation<AccessoryDTO, FormData>({
            query: (accessory) => ({
                url: "accessories/",
                method: "POST",
                body: accessory,
                formData: true,
            }),
            invalidatesTags: [{ type: "Accessory", id: "LIST" }],
        }),
        deleteAccessory: builder.mutation<void, number>({
            query: (id) => ({
                url: `accessories/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, id) => [
                { type: "Accessory", id },
                { type: "Accessory", id: "LIST" },
            ],
        }),
        getAccessories: builder.query<AccessoryDTO[], void>({
            query: () => "accessories/",
            providesTags: (result) =>
                result
                    ? [
                          ...result.map(({ id }) => ({ type: "Accessory" as const, id })),
                          { type: "Accessory" as const, id: "LIST" },
                      ]
                    : [{ type: "Accessory" as const, id: "LIST" }],
        }),
        updateAccessory: builder.mutation<
            AccessoryDTO,
            { accessoryID: number; accessoryData: FormData }
        >({
            query: ({ accessoryID, accessoryData }) => ({
                url: `accessories/${accessoryID}/`,
                method: "PUT",
                body: accessoryData,
                formData: true,
            }),
            invalidatesTags: (result, error, { accessoryID }) => [
                { type: "Accessory", id: accessoryID },
                { type: "Accessory", id: "LIST" },
            ],
        }),
    }),
});

export const {
    useCreateAccessoryMutation,
    useDeleteAccessoryMutation,
    useGetAccessoriesQuery,
    useUpdateAccessoryMutation,
} = accessoryApiSlice;
