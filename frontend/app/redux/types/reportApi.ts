import type { ReportTypeCode } from "@/types/report";

export type UpdateReportFileArgs = {
    id: number;
    pdf_file?: File;
    word_file?: File;
    description?: string;
};

export type CreateReportArgs = {
    completion_date: string;
    report_type: ReportTypeCode;
    description: string;
    pdf_file: File;
    word_file: File;
    unit?: number;
    equipment?: number;
};
