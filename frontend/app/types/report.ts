export type ReportTypeCode =
    | "CQ"
    | "CQM"
    | "TE"
    | "LR"
    | "M"
    | "TR"
    | "TSR"
    | "AD"
    | "ID"
    | "POP"
    | "O";

/**
 * Data Transfer Object for Report as exposed by the backend REST API.
 * Dates are ISO strings; file is expected to be a direct URL for download.
 */
export type ReportDTO = {
    id: number;
    report_type: ReportTypeCode;
    completion_date: string;
    due_date: string | null;
    unit: number | null;
    equipment: number | null;
    file: string;
};

/**
 * Human-readable labels for report_type codes.
 * Mirrors backend Report.ReportType choices.
 */
export const reportTypeLabel: Record<ReportTypeCode, string> = {
    CQ: "Controle de Qualidade",
    CQM: "Controle de Qualidade de Monitores",
    TE: "Teste de EPI",
    LR: "Levantamento Radiométrico e Fuga de Cabeçote",
    M: "Memorial",
    TR: "Treinamento de Radioproteção",
    TSR: "Treinamento de Segurança em Ressonância Magnética",
    AD: "Ato de designação",
    ID: "Investigação de dose",
    POP: "POP",
    O: "Outros",
};
