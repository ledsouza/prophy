import { apiSlice } from "../services/apiSlice";
import type { ServiceOrderDTO } from "./visitApiSlice";

export type CreateServiceOrderInput = {
    visit: number;
    subject: string;
    description: string;
    conclusion: string;
    equipments: number[];
};

const serviceOrderApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createServiceOrder: builder.mutation<ServiceOrderDTO, CreateServiceOrderInput>({
            query: (body) => ({
                url: "service-orders/",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "Visit", id: "LIST" }],
        }),
    }),
});

export const { useCreateServiceOrderMutation } = serviceOrderApiSlice;
export default serviceOrderApiSlice;
