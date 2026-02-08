import type { ReportTypeCode } from "@/types/report";

export type UpdateReportFileArgs = {
    id: number;
    file: File;
};

export type CreateReportArgs = {
    completion_date: string;
    report_type: ReportTypeCode;
    file: File;
    unit?: number;
    equipment?: number;
};

export type DownloadReportResult = {
    success: boolean;
};
