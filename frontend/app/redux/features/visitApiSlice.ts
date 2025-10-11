import { apiSlice } from "../services/apiSlice";
import { createPaginatedQueryFn } from "../services/paginationHelpers";
import type {
    VisitDTO,
    CreateVisitPayload,
    UpdateVisitPayload,
    ListVisitsArgs,
} from "@/types/visit";

const visitApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        /**
         * Lists visits.
         * - If args.page is provided: returns just that page (optionally filtered by unit).
         * - If args.page is not provided: auto-paginates and returns all visits across all pages (optionally filtered by unit).
         */
        listVisits: builder.query<VisitDTO[], ListVisitsArgs | void>({
            queryFn: createPaginatedQueryFn<VisitDTO, ListVisitsArgs>("visits/"),
            providesTags: [{ type: "Visit", id: "LIST" }],
        }),
        createVisit: builder.mutation<VisitDTO, CreateVisitPayload>({
            query: (data) => ({
                url: "visits/",
                method: "POST",
                body: data,
            }),
            invalidatesTags: [{ type: "Visit", id: "LIST" }],
        }),
        updateVisit: builder.mutation<VisitDTO, { id: number; data: UpdateVisitPayload }>({
            query: ({ id, data }) => ({
                url: `visits/${id}/`,
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: [{ type: "Visit", id: "LIST" }],
        }),
        deleteVisit: builder.mutation<{ success: boolean; id: number }, number>({
            query: (id) => ({
                url: `visits/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "Visit", id: "LIST" }],
        }),
    }),
});

export const {
    useListVisitsQuery,
    useCreateVisitMutation,
    useUpdateVisitMutation,
    useDeleteVisitMutation,
} = visitApiSlice;
export default visitApiSlice;
