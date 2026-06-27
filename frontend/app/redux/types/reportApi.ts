import type { ReportTypeCode } from "@/types/report";

export type UpdateReportFileArgs = {
    id: number;
    pdf_file?: File;
    word_file?: File;
};

export type CreateReportArgs = {
    completion_date: string;
    report_type: ReportTypeCode;
    pdf_file: File;
    word_file: File;
    unit?: number;
    equipment?: number;
};
