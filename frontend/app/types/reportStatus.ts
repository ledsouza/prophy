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
        default:
            return undefined;
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
        default:
            return { text: "Desconhecido", color: "text-gray-secondary bg-gray-100" };
    }
};
