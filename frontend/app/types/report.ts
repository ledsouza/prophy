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
 * Derived status for a report based on its due_date.
 * Computed by the backend serializer.
 */
export type ReportStatus = "overdue" | "due_soon" | "ok" | "unknown" | "archived";

/**
 * Responsible user information for a report.
 */
export type ReportResponsible = {
    id: number;
    name: string;
    role: string;
};

/**
 * Data Transfer Object for Report as exposed by the backend REST API.
 * Dates are ISO strings; file is expected to be a direct URL for download.
 */
export type ReportDTO = {
    id: number;
    report_type: ReportTypeCode;
    completion_date: string;
    due_date: string | null;
    status: ReportStatus;
    unit: number | null;
    equipment: number | null;
    file: string;
    is_deleted: boolean;
};

/**
 * Extended Report DTO with search-specific fields.
 * Includes derived status, responsible users, and denormalized names.
 */
export type ReportSearchDTO = ReportDTO & {
    status: ReportStatus;
    responsibles: ReportResponsible[];
    responsibles_display: string;
    unit_name?: string;
    client_name?: string;
    equipment_name?: string;
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

/**
 * Arguments for listing reports.
 * Supports pagination and filtering by unit and/or equipment.
 */
export type ListReportsArgs =
    | { page: number; unit?: number; equipment?: number }
    | { unit?: number; equipment?: number };

/**
 * Arguments for searching reports with filters.
 * Used in the Reports search tab for GP, FMI, and FME roles.
 */
export type SearchReportsArgs = {
    page?: number;
    status?: ReportStatus;
    due_date_start?: string;
    due_date_end?: string;
    client_name?: string;
    client_cnpj?: string;
    unit_name?: string;
    unit_city?: string;
    responsible_cpf?: string;
};
