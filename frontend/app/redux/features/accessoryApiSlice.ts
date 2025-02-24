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
        }),
        deleteAccessory: builder.mutation<void, number>({
            query: (id) => ({
                url: `accessories/${id}`,
                method: "DELETE",
            }),
        }),
        getAccessories: builder.query<AccessoryDTO[], void>({
            query: () => "accessories/",
        }),
        updateAccessory: builder.mutation<
            AccessoryDTO,
            { id: number; formData: FormData }
        >({
            query: ({ id, formData }) => ({
                url: `accessories/${id}`,
                method: "PUT",
                body: formData,
                formData: true,
            }),
        }),
    }),
});

export const {
    useCreateAccessoryMutation,
    useDeleteAccessoryMutation,
    useGetAccessoriesQuery,
    useUpdateAccessoryMutation,
} = accessoryApiSlice;
