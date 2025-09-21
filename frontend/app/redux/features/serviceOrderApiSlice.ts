import { apiSlice } from "../services/apiSlice";
import type { ServiceOrderDTO } from "./visitApiSlice";

export type CreateServiceOrderPayload = {
    visit: number;
    subject: string;
    description: string;
    conclusion: string;
    equipments: number[];
};

export type UpdateServiceOrderPayload = {
    subject?: string;
    description?: string;
    conclusion?: string;
    equipments?: number[];
};

const serviceOrderApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createServiceOrder: builder.mutation<ServiceOrderDTO, CreateServiceOrderPayload>({
            query: (body) => ({
                url: "service-orders/",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "Visit", id: "LIST" }],
        }),
        updateServiceOrder: builder.mutation<
            ServiceOrderDTO,
            { id: number; data: UpdateServiceOrderPayload }
        >({
            query: ({ id, data }) => ({
                url: `service-orders/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: [{ type: "Visit", id: "LIST" }],
        }),
    }),
});

export const { useCreateServiceOrderMutation, useUpdateServiceOrderMutation } =
    serviceOrderApiSlice;
export default serviceOrderApiSlice;
