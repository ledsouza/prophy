import { apiSlice } from "../services/apiSlice";
import { createPaginatedQueryFn } from "../services/paginationHelpers";
import type { ReportDTO, ListReportsArgs, ReportTypeCode } from "@/types/report";

type UpdateReportFileArgs = {
    id: number;
    file: File;
};

type CreateReportArgs = {
    completion_date: string; // YYYY-MM-DD
    report_type: ReportTypeCode;
    file: File;
    unit?: number;
    equipment?: number;
};

const reportApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        /**
         * Lists reports.
         * - If args.page is provided: returns just that page (optionally filtered by unit/equipment).
         * - If args.page is not provided: auto-paginates and returns all reports across all pages (optionally filtered by unit/equipment).
         */
        listReports: builder.query<ReportDTO[], ListReportsArgs | void>({
            queryFn: createPaginatedQueryFn<ReportDTO, ListReportsArgs>("reports/"),
            providesTags: [{ type: "Report", id: "LIST" }],
        }),
        createReport: builder.mutation<ReportDTO, CreateReportArgs>({
            query: ({ completion_date, report_type, file, unit, equipment }) => {
                const formData = new FormData();
                formData.append("completion_date", completion_date);
                formData.append("report_type", report_type);
                formData.append("file", file);
                if (typeof unit === "number") formData.append("unit", String(unit));
                if (typeof equipment === "number") formData.append("equipment", String(equipment));
                return {
                    url: `reports/`,
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: [{ type: "Report", id: "LIST" }],
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
        downloadReportFile: builder.query<Blob, number>({
            query: (id) => ({
                url: `reports/${id}/download/`,
                method: "GET",
                responseHandler: (response) => response.blob(),
            }),
            keepUnusedDataFor: 0,
        }),
    }),
});

export const {
    useListReportsQuery,
    useCreateReportMutation,
    useUpdateReportFileMutation,
    useLazyDownloadReportFileQuery,
} = reportApiSlice;
export default reportApiSlice;
