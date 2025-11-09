"use client";

import { useState } from "react";

import { ReportList } from "@/components/client";
import { Button, ErrorDisplay, Modal, Spinner } from "@/components/common";
import { ReportForm } from "@/components/forms";
import { Typography } from "@/components/foundation";

import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import { useListReportsQuery } from "@/redux/features/reportApiSlice";
import { child } from "@/utils/logger";

type EquipmentReportsTabProps = {
    equipmentId: number;
};

/**
 * EquipmentReportsTab
 *
 * Displays a compact list of reports for a specific equipment within
 * a tab context. Optimized for smaller containers with tighter spacing
 * and simplified layout.
 *
 * Features:
 * - Lists all reports for the equipment
 * - Button to create new reports (for authorized users)
 * - Compact design for tab context
 */
function EquipmentReportsTab({ equipmentId }: EquipmentReportsTabProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data: reports, isLoading, error } = useListReportsQuery({ equipment: equipmentId });

    const { data: user } = useRetrieveUserQuery();
    const allowedRoles = new Set(["GP", "FMI", "FME"]);
    const canCreate = !!user && allowedRoles.has(user.role);
    const log = child({ component: "EquipmentReportsTab" });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-8">
                <Spinner md />
            </div>
        );
    }

    if (error) {
        log.error(
            {
                equipmentId,
                error: (error as any)?.status ?? (error as any)?.message ?? "unknown",
            },
            "Failed to load equipment reports"
        );
        return (
            <ErrorDisplay
                title="Erro ao carregar relatórios"
                message="Não foi possível carregar a lista de relatórios. Tente novamente."
            />
        );
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Header with create button */}
            {canCreate && (
                <div className="flex justify-between items-center">
                    <Typography element="h3" size="lg" className="font-semibold">
                        Relatórios do Equipamento
                    </Typography>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        data-testid="btn-create-equipment-report"
                    >
                        Gerar relatório
                    </Button>
                </div>
            )}

            {/* Reports list with scroll */}
            <div className="flex-1 overflow-y-auto pr-2">
                <ReportList
                    reports={reports || []}
                    emptyStateMessage="Nenhum relatório cadastrado para este equipamento."
                />
            </div>

            {/* Modal for creating new report */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                className="max-w-lg"
            >
                <ReportForm
                    isUnit={false}
                    equipmentId={equipmentId}
                    onCancel={() => setIsCreateOpen(false)}
                    onSuccess={() => setIsCreateOpen(false)}
                    submitTestId="btn-equipment-report-create-submit"
                />
            </Modal>
        </div>
    );
}

export default EquipmentReportsTab;
