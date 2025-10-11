import { apiSlice, PaginatedResponse } from "../services/apiSlice";
import type { ReportDTO, ListReportsArgs } from "@/types/report";

type UpdateReportFileArgs = {
    id: number;
    file: File;
};

const reportApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        /**
         * Lists reports.
         * - If args.page is provided: returns just that page (optionally filtered by unit/equipment).
         * - If args.page is not provided: auto-paginates and returns all reports across all pages (optionally filtered by unit/equipment).
         */
        listReports: builder.query<ReportDTO[], ListReportsArgs | void>({
            async queryFn(args, _queryApi, _extraOptions, baseQuery) {
                const unit = args && "unit" in args ? args.unit : undefined;
                const equipment = args && "equipment" in args ? args.equipment : undefined;
                const explicitPage = args && "page" in args ? args.page : undefined;

                // Build params object
                const buildParams = (page?: number) => {
                    const params: Record<string, number> = {};
                    if (page !== undefined) params.page = page;
                    if (unit !== undefined) params.unit = unit;
                    if (equipment !== undefined) params.equipment = equipment;
                    return params;
                };

                // If a specific page was requested, return only that page
                if (explicitPage) {
                    const response = await baseQuery({
                        url: "reports/",
                        method: "GET",
                        params: buildParams(explicitPage),
                    });
                    if (response.error) return { error: response.error };

                    const data = response.data as PaginatedResponse<ReportDTO> | ReportDTO[];
                    if (Array.isArray(data)) {
                        return { data };
                    }
                    if (data && "results" in data) {
                        return { data: data.results };
                    }
                    return { data: [] };
                }

                // Otherwise, paginate through all pages and merge
                let all: ReportDTO[] = [];
                let currentPage = 1;
                let hasNextPage = true;

                while (hasNextPage) {
                    const response = await baseQuery({
                        url: "reports/",
                        method: "GET",
                        params: buildParams(currentPage),
                    });

                    if (response.error) return { error: response.error };

                    const data = response.data as PaginatedResponse<ReportDTO> | ReportDTO[];

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
            providesTags: [{ type: "Report", id: "LIST" }],
        }),
        updateReportFile: builder.mutation<ReportDTO, UpdateReportFileArgs>({
            query: ({ id, file }) => {
                const formData = new FormData();
                formData.append("file", file);
                return {
                    url: `reports/${id}/`,
                    method: "PATCH",
                    body: formData,
                };
            },
            invalidatesTags: [{ type: "Report", id: "LIST" }],
        }),
    }),
});

export const { useListReportsQuery, useUpdateReportFileMutation } = reportApiSlice;
export default reportApiSlice;
