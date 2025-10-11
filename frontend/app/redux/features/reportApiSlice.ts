import { apiSlice } from "../services/apiSlice";
import type { ReportDTO } from "@/types/report";

type UpdateReportFileArgs = {
    id: number;
    file: File;
};

type ListReportsParams = {
    unit?: number;
    equipment?: number;
};

const reportApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        listReports: builder.query<ReportDTO[], ListReportsParams | void>({
            query: (params) => ({
                url: "reports/",
                method: "GET",
                params: params || {},
            }),
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
        }),
    }),
});

export const { useListReportsQuery, useUpdateReportFileMutation } = reportApiSlice;
export default reportApiSlice;
