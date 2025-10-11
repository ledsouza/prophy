import { apiSlice } from "../services/apiSlice";
import type { ServiceOrderDTO, UpdateServiceOrderPayload } from "@/types/service-order";

type CreateServiceOrderArgs = {
    visit: number;
    subject: string;
    description: string;
    conclusion: string;
    equipments: number[];
};

export const serviceOrderApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createServiceOrder: builder.mutation<ServiceOrderDTO, CreateServiceOrderArgs>({
            query: (data) => ({
                url: "service-orders/",
                method: "POST",
                body: data,
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
        downloadServiceOrderPDF: builder.query<Blob, number>({
            query: (id) => ({
                url: `service-orders/${id}/pdf/`,
                method: "GET",
                responseHandler: (response) => response.blob(),
            }),
            keepUnusedDataFor: 0,
        }),
    }),
});

export const {
    useCreateServiceOrderMutation,
    useUpdateServiceOrderMutation,
    useLazyDownloadServiceOrderPDFQuery,
} = serviceOrderApiSlice;
