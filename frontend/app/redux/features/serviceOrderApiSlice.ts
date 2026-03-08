import type { ServiceOrderDTO, UpdateServiceOrderPayload } from "@/types/service-order";
import { apiSlice } from "../services/apiSlice";
import {
    createDownloadQueryFn,
    type DownloadSuccessResult,
} from "../services/downloadEndpoint";
import type { CreateServiceOrderArgs } from "../types/serviceOrderApi";
import { child } from "@/utils/logger";

const log = child({ feature: "serviceOrderApiSlice" });

export const serviceOrderApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createServiceOrder: builder.mutation<ServiceOrderDTO, CreateServiceOrderArgs>({
            query: (data) => ({
                url: "service-orders/",
                method: "POST",
                body: data,
            }),
            invalidatesTags: [{ type: "Appointment", id: "LIST" }],
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
            invalidatesTags: [{ type: "Appointment", id: "LIST" }],
        }),
        downloadServiceOrderPDF: builder.query<DownloadSuccessResult, number>({
            queryFn: createDownloadQueryFn<number>({
                buildRequest: (id) => ({
                    url: `service-orders/${id}/pdf/`,
                    method: "GET",
                }),
                getFallbackFilename: (id) => `service_order_${id}.pdf`,
                getLogContext: (id) => ({ serviceOrderId: id }),
                log,
                successMessage: "Service order PDF downloaded successfully",
                errorMessage: "Failed to download service order PDF",
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
