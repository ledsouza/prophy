import { apiSlice } from "../services/apiSlice";

export type ServiceOrderDTO = {
    id: number;
    subject: string;
    description: string;
    conclusion: string;
    equipments: number[];
};

export type ServiceOrderBasePayload = Pick<
    ServiceOrderDTO,
    "subject" | "description" | "conclusion" | "equipments"
>;

export type CreateServiceOrderPayload = ServiceOrderBasePayload & {
    visit: number;
};

export type UpdateServiceOrderPayload = Partial<ServiceOrderBasePayload>;

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
