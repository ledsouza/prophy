import type {
    ListReportsArgs,
    ReportDTO,
    ReportSearchDTO,
    ReportTypeCode,
    SearchReportsArgs,
} from "@/types/report";
import { downloadBlobFromContentDisposition } from "@/utils/download";
import { child } from "@/utils/logger";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { apiSlice, PaginatedResponse } from "../services/apiSlice";
import { createPaginatedQueryFn } from "../services/paginationHelpers";

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

type DownloadReportResult = {
    success: boolean;
};

const log = child({ feature: "reportApiSlice" });

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
        downloadReportFile: builder.query<DownloadReportResult, number>({
            queryFn: async (
                id,
                api,
                extraOptions,
                baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>,
            ) => {
                try {
                    const result = await baseQuery(
                        {
                            url: `reports/${id}/download/`,
                            method: "GET",
                            responseHandler: (response) => {
                                const contentDisposition =
                                    response.headers.get("content-disposition");
                                return response.blob().then((blob) => ({
                                    blob,
                                    contentDisposition,
                                }));
                            },
                        },
                        api,
                        extraOptions,
                    );

                    if (result.error) {
                        log.error(
                            { reportId: id, error: result.error },
                            "Failed to download report file",
                        );
                        return { error: result.error };
                    }

                    const { blob, contentDisposition } = result.data as {
                        blob: Blob;
                        contentDisposition: string | null;
                    };

                    downloadBlobFromContentDisposition({
                        blob,
                        contentDisposition,
                        fallbackFilename: `relatorio_${id}`,
                    });

                    log.info({ reportId: id }, "Report downloaded successfully");

                    return { data: { success: true } };
                } catch (error) {
                    log.error({ reportId: id, error }, "Unexpected error during report download");
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            error: String(error),
                        },
                    };
                }
            },
            keepUnusedDataFor: 0,
        }),
        /**
         * Searches reports with filters.
         * Returns paginated results with derived fields (status,
         * responsibles).
         */
        searchReports: builder.query<PaginatedResponse<ReportSearchDTO>, SearchReportsArgs>({
            query: ({
                page = 1,
                status,
                due_date_start,
                due_date_end,
                client_name,
                client_cnpj,
                unit_name,
                unit_city,
                responsible_cpf,
            }) => {
                const params: Record<string, any> = { page };
                if (status) params.status = status;
                if (due_date_start) params.due_date_start = due_date_start;
                if (due_date_end) params.due_date_end = due_date_end;
                if (client_name) params.client_name = client_name;
                if (client_cnpj) params.client_cnpj = client_cnpj;
                if (unit_name) params.unit_name = unit_name;
                if (unit_city) params.unit_city = unit_city;
                if (responsible_cpf) params.responsible_cpf = responsible_cpf;

                return {
                    url: "reports/",
                    method: "GET",
                    params,
                };
            },
            providesTags: (result) =>
                result
                    ? [
                          ...result.results.map(({ id }) => ({
                              type: "Report" as const,
                              id,
                          })),
                          { type: "Report", id: "SEARCH" },
                      ]
                    : [{ type: "Report", id: "SEARCH" }],
        }),
        /**
         * Soft deletes a report.
         */
        softDeleteReport: builder.mutation<void, { id: number }>({
            query: ({ id }) => ({
                url: `reports/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: [
                { type: "Report", id: "LIST" },
                { type: "Report", id: "SEARCH" },
            ],
        }),
        /**
         * Hard deletes a report.
         */
        hardDeleteReport: builder.mutation<void, { id: number }>({
            query: ({ id }) => ({
                url: `reports/${id}/?hard=true`,
                method: "DELETE",
            }),
            invalidatesTags: [
                { type: "Report", id: "LIST" },
                { type: "Report", id: "SEARCH" },
            ],
        }),
        /**
         * Restores a soft-deleted report.
         */
        restoreReport: builder.mutation<ReportDTO, { id: number }>({
            query: ({ id }) => ({
                url: `reports/${id}/restore/`,
                method: "POST",
            }),
            invalidatesTags: [
                { type: "Report", id: "LIST" },
                { type: "Report", id: "SEARCH" },
            ],
        }),
    }),
});

export const {
    useListReportsQuery,
    useCreateReportMutation,
    useUpdateReportFileMutation,
    useLazyDownloadReportFileQuery,
    useSearchReportsQuery,
    useSoftDeleteReportMutation,
    useHardDeleteReportMutation,
    useRestoreReportMutation,
} = reportApiSlice;
export default reportApiSlice;
