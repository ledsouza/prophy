"use client";

import clsx from "clsx";
import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";

import { Button, Modal } from "@/components/common";
import { Typography } from "@/components/foundation";

import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import { useUpdateReportFileMutation } from "@/redux/features/reportApiSlice";
import type { ReportDTO } from "@/types/report";
import { reportTypeLabel } from "@/types/report";

import { child } from "@/utils/logger";
import { FileArrowDownIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { toast } from "react-toastify";

type ReportCardProps = {
    report: ReportDTO;
    unitName?: string;
    equipmentName?: string;
    dataTestId?: string;
};

/**
 * ReportCard
 *
 * Displays a report summary with dates and file actions.
 * No status section is shown; due_date is informational for the next report schedule.
 *
 * Actions:
 * - Download current file (visible to all)
 * - Update/replace file (visible to GP/FMI/FME only)
 */
function ReportCard({ report, unitName, equipmentName, dataTestId }: ReportCardProps) {
    const { data: userData } = useRetrieveUserQuery();
    const role = userData?.role;
    const canUpdate = role === "GP" || role === "FMI" || role === "FME";
    const log = child({ component: "ReportCard" });

    const [updateOpen, setUpdateOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [updateReportFile, { isLoading: isUpdating }] = useUpdateReportFileMutation();

    const completionDateLabel = useMemo(() => {
        try {
            const d = parseISO(report.completion_date);
            return format(d, "dd/MM/yyyy");
        } catch {
            return report.completion_date;
        }
    }, [report.completion_date]);

    const dueDateLabel = useMemo(() => {
        if (!report.due_date) return "—";
        try {
            const d = parseISO(report.due_date);
            return format(d, "dd/MM/yyyy");
        } catch {
            return report.due_date;
        }
    }, [report.due_date]);

    const containerStyle = clsx(
        "bg-light rounded-xl shadow-sm",
        "p-6 divide-y-2",
        "hover:ring-1 hover:ring-inset hover:ring-primary"
    );

    function handleDownload() {
        if (!report.file) {
            log.info({ reportId: report.id }, "Download blocked: no file URL");
            toast.info("Sem arquivo disponível para download.");
            return;
        }
        try {
            window.open(report.file, "_blank", "noopener,noreferrer");
        } catch (err) {
            log.error({ reportId: report.id, error: (err as any)?.message }, "Download failed");
            toast.error("Falha ao abrir o arquivo do relatório.");
        }
    }

    async function handleSubmitUpdate() {
        if (!file) {
            toast.info("Selecione um arquivo para enviar.");
            return;
        }
        try {
            await updateReportFile({ id: report.id, file }).unwrap();
            toast.success("Arquivo do relatório atualizado com sucesso.");
            setUpdateOpen(false);
            setFile(null);
        } catch (err) {
            log.error(
                { reportId: report.id, error: (err as any)?.message },
                "Update report file failed"
            );
            toast.error("Não foi possível atualizar o arquivo do relatório.");
        }
    }

    return (
        <div className={containerStyle} data-testid={dataTestId || `report-card-${report.id}`}>
            {/* Header */}
            <div className="flex flex-col gap-1 pb-4">
                <Typography element="h3" size="title3">
                    {reportTypeLabel?.[report.report_type] ?? "Relatório"}
                </Typography>
                {/* Optional contextual names */}
                {(unitName || equipmentName) && (
                    <Typography element="p" size="md" className="text-secondary">
                        {unitName ? `Unidade: ${unitName}` : ""}
                        {unitName && equipmentName ? " • " : ""}
                        {equipmentName ? `Equipamento: ${equipmentName}` : ""}
                    </Typography>
                )}
            </div>

            {/* Body + Actions */}
            <div className="flex flex-wrap items-center justify-between pt-4 gap-2">
                <div className="flex flex-col">
                    <Typography element="p" size="md">
                        Data de conclusão:{" "}
                        <Typography element="span" className="font-semibold">
                            {completionDateLabel}
                        </Typography>
                    </Typography>
                    <Typography element="p" size="md">
                        Vencimento:{" "}
                        <Typography element="span" className="font-semibold">
                            {dueDateLabel}
                        </Typography>
                    </Typography>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="secondary"
                        onClick={handleDownload}
                        data-testid="btn-report-download"
                        aria-label="Baixar relatório"
                        title="Baixar relatório"
                    >
                        <FileArrowDownIcon size={20} />
                    </Button>

                    {canUpdate && (
                        <Button
                            variant="primary"
                            onClick={() => setUpdateOpen(true)}
                            data-testid="btn-report-update"
                            aria-label="Atualizar arquivo do relatório"
                            title="Atualizar arquivo do relatório"
                        >
                            <UploadSimpleIcon size={20} />
                        </Button>
                    )}
                </div>
            </div>

            <Modal
                isOpen={updateOpen}
                onClose={() => {
                    if (!isUpdating) setUpdateOpen(false);
                }}
                className="max-w-md px-2 sm:px-6"
            >
                <div className="space-y-4">
                    <Typography element="h3" size="lg">
                        Atualizar arquivo do relatório
                    </Typography>
                    <input
                        type="file"
                        onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            setFile(f || null);
                        }}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.odt,.txt,image/*"
                        aria-label="Selecionar arquivo do relatório"
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setUpdateOpen(false)}
                            disabled={isUpdating}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmitUpdate}
                            disabled={isUpdating || !file}
                            data-testid="btn-report-update-submit"
                        >
                            {isUpdating ? "Enviando..." : "Salvar"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default ReportCard;
