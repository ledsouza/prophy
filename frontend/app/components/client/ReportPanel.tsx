"use client";

import { ReportList } from "@/components/client";
import { Button, ErrorDisplay, Spinner } from "@/components/common";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import { useListReportsQuery } from "@/redux/features/reportApiSlice";
import { child } from "@/utils/logger";
import clsx from "clsx";

type ReportPanelProps = {
    unitId?: number;
    equipmentId?: number;
    onCreateReport?: () => void;
    createButtonTestId?: string;
    containerClassName?: string;
};

/**
 * ReportPanel component for displaying and managing reports for a specific
 * unit or equipment.
 *
 * Layout notes
 * - Intended to be used inside TabbedResourcePanel or another fixed-height
 *   flex container.
 * - The root uses min-h-0 and the list is wrapped in a flex-1 overflow-y-auto
 *   div so the list can scroll while the bottom button remains visible.
 *
 * @param unitId - The ID of the unit to fetch reports for.
 * @param equipmentId - The ID of the equipment to fetch reports for.
 * @param onCreateReport - Callback invoked when the create report button is
 *   clicked.
 * @param createButtonTestId - Test ID for the create report button.
 * @param containerClassName - Additional CSS classes to apply to the
 *   container div.
 */
function ReportPanel({
    unitId,
    equipmentId,
    onCreateReport,
    createButtonTestId = "btn-create-report",
    containerClassName = "",
}: ReportPanelProps) {
    const queryParams = {
        ...(unitId && { unit: unitId }),
        ...(equipmentId && { equipment: equipmentId }),
    };

    const {
        data: reports,
        isLoading,
        error,
    } = useListReportsQuery(Object.keys(queryParams).length > 0 ? queryParams : undefined);

    const { data: user } = useRetrieveUserQuery();
    const allowedRoles = new Set(["GP", "FMI", "FME"]);
    const canCreate = !!user && allowedRoles.has(user.role);
    const log = child({ component: "ReportPanel" });

    if (isLoading) {
        return (
            <div className={containerClassName}>
                <Spinner md />
            </div>
        );
    }

    if (error) {
        log.error(
            {
                unitId,
                equipmentId,
                error: (error as any)?.status ?? (error as any)?.message ?? "unknown",
            },
            "Failed to load reports"
        );
        return (
            <div className={containerClassName}>
                <ErrorDisplay
                    title="Erro ao carregar relatórios"
                    message="Não foi possível carregar a lista de relatórios. Tente novamente."
                />
            </div>
        );
    }

    return (
        <div className={clsx("flex flex-col gap-6 h-full min-h-0", containerClassName)}>
            <div className="flex-1 overflow-y-auto [scrollbar-gutter:stable] pr-2">
                <ReportList reports={reports || []} />
            </div>

            {canCreate && (
                <Button onClick={onCreateReport ?? (() => {})} data-testid={createButtonTestId}>
                    Gerar relatório
                </Button>
            )}
        </div>
    );
}

export default ReportPanel;
