import { apiSlice, PaginatedResponse, ListQueryParams } from "../services/apiSlice";
import VisitStatus from "@/enums/VisitStatus";
import type { ServiceOrderDTO } from "./serviceOrderApiSlice";

export type VisitDTO = {
    id: number;
    date: string; // ISO datetime from backend
    status: VisitStatus;
    justification?: string | null;
    contact_phone: string;
    contact_name: string;
    service_order?: ServiceOrderDTO | null;
    unit: number;
};

type ListVisitsArgs = ListQueryParams & {
    unit?: number;
};

const visitApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        /**
         * Lists visits.
         * - If args.page is provided: returns just that page (optionally filtered by unit).
         * - If args.page is not provided: auto-paginates and returns all visits across all pages (optionally filtered by unit).
         */
        listVisits: builder.query<VisitDTO[], ListVisitsArgs | void>({
            async queryFn(args, _queryApi, _extraOptions, baseQuery) {
                const unit = args && "unit" in args ? args.unit : undefined;
                const explicitPage = args && "page" in args ? args.page : undefined;

                // If a specific page was requested, return only that page
                if (explicitPage) {
                    const response = await baseQuery({
                        url: "visits/",
                        method: "GET",
                        params: unit ? { page: explicitPage, unit } : { page: explicitPage },
                    });
                    if (response.error) return { error: response.error };

                    const data = response.data as PaginatedResponse<VisitDTO> | VisitDTO[];
                    if (Array.isArray(data)) {
                        return { data };
                    }
                    if (data && "results" in data) {
                        return { data: data.results };
                    }
                    return { data: [] };
                }

                // Otherwise, paginate through all pages and merge
                let all: VisitDTO[] = [];
                let currentPage = 1;
                let hasNextPage = true;

                while (hasNextPage) {
                    const response = await baseQuery({
                        url: "visits/",
                        method: "GET",
                        params: unit ? { page: currentPage, unit } : { page: currentPage },
                    });

                    if (response.error) return { error: response.error };

                    const data = response.data as PaginatedResponse<VisitDTO> | VisitDTO[];

                    if (Array.isArray(data)) {
                        all = data;
                        hasNextPage = false;
                    } else if (data && "results" in data) {
                        all = [...all, ...data.results];
                        hasNextPage = data.next !== null;
                        currentPage++;
                    } else {
                        hasNextPage = false;
                    }
                }

                return { data: all };
            },
            providesTags: [{ type: "Visit", id: "LIST" }],
        }),
        createVisit: builder.mutation<
            VisitDTO,
            {
                unit: number;
                date: string;
                contact_name: string;
                contact_phone: string;
                status?: VisitStatus;
                justification?: string | null;
            }
        >({
            query: (data) => ({
                url: "visits/",
                method: "POST",
                body: data,
            }),
            invalidatesTags: [{ type: "Visit", id: "LIST" }],
        }),
        updateVisit: builder.mutation<
            VisitDTO,
            { id: number; data: Partial<VisitDTO> | Record<string, any> }
        >({
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
