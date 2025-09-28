import { apiSlice } from "../services/apiSlice";
import type { ReportDTO } from "@/types/report";

type UpdateReportFileArgs = {
    id: number;
    file: File;
};

const reportApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
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

export const { useUpdateReportFileMutation } = reportApiSlice;
export default reportApiSlice;
