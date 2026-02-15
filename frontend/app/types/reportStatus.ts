import type { SelectData } from "@/components/forms/Select";
import type { ReportStatus } from "./report";

/**
 * Select options for report status filter.
 */
export const REPORT_STATUS_OPTIONS: SelectData[] = [
    { id: 0, value: "Todos" },
    { id: 1, value: "Vencido" },
    { id: 2, value: "Vence em breve" },
    { id: 3, value: "Em dia" },
    { id: 4, value: "Arquivado" },
    { id: 5, value: "Sem vencimento" },
];

/**
 * Maps a select option ID to the corresponding ReportStatus value.
 *
 * @param id - The select option ID
 * @returns The corresponding ReportStatus, or undefined for "Todos" (id: 0)
 */
export const getReportStatusFromOptionId = (id: number): ReportStatus | undefined => {
    switch (id) {
        case 1:
            return "overdue";
        case 2:
            return "due_soon";
        case 3:
            return "ok";
        case 4:
            return "archived";
        case 5:
            return "no_due_date";
        default:
            return undefined;
    }
};

/**
 * Maps a ReportStatus value back to a select option ID.
 *
 * @param value - ReportStatus value as stored in URL params
 * @returns Select option ID. Defaults to 0 (Todos).
 */
export const getReportStatusOptionIdFromValue = (value: string | null | undefined): number => {
    switch (value) {
        case "overdue":
            return 1;
        case "due_soon":
            return 2;
        case "ok":
            return 3;
        case "archived":
            return 4;
        case "no_due_date":
            return 5;
        default:
            return 0;
    }
};

/**
 * Returns the display information for a report status including text and styling.
 * Uses design tokens from globals.css and tailwind.config.ts.
 * Follows the same pattern as getStatusDisplay() in utils/format.ts.
 *
 * @param status - The report status
 * @returns Object with text label and CSS classes for badge styling
 */
export const getReportStatusDisplay = (status: ReportStatus): { text: string; color: string } => {
    switch (status) {
        case "overdue":
            return { text: "Vencido", color: "text-danger bg-danger/10" };
        case "due_soon":
            return { text: "Vence em breve", color: "text-warning bg-warning/10" };
        case "ok":
            return { text: "Em dia", color: "text-success bg-success/10" };
        case "archived":
            return { text: "Arquivado", color: "text-gray-secondary bg-gray-100" };
        case "no_due_date":
            return { text: "Sem vencimento", color: "text-gray-secondary bg-gray-100" };
        default:
            return { text: "Desconhecido", color: "text-gray-secondary bg-gray-100" };
    }
};
