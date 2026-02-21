"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

import { Button, Modal } from "@/components/common";
import { Form, Input } from "@/components/forms";
import { Typography } from "@/components/foundation";
import Role from "@/enums/Role";

import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import {
    useHardDeleteReportMutation,
    useLazyDownloadReportFileQuery,
    useRestoreReportMutation,
    useSoftDeleteReportMutation,
    useUpdateReportFileMutation,
} from "@/redux/features/reportApiSlice";
import { reportFileSchema } from "@/schemas";
import type { ReportDTO } from "@/types/report";
import { reportTypeLabel } from "@/types/report";
import { getReportStatusDisplay } from "@/types/reportStatus";

import { child } from "@/utils/logger";
import {
    ArrowCounterClockwiseIcon,
    FileArrowDownIcon,
    TrashIcon,
    UploadSimpleIcon,
} from "@phosphor-icons/react";
import { toast } from "react-toastify";

const updateReportFileFormSchema = z.object({
    file: reportFileSchema,
});

type UpdateReportFileFormData = z.infer<typeof updateReportFileFormSchema>;

type ReportCardProps = {
    report: ReportDTO;
    dataTestId?: string;
};

/**
 * ReportCard
 *
 * Displays a report summary with dates and file actions.
 *
 * Actions:
 * - Download current file (visible to all)
 * - Update/replace file (visible to GP/FMI/FME only)
 */
function ReportCard({ report, dataTestId }: ReportCardProps) {
    const { data: userData } = useRetrieveUserQuery();
    const role = userData?.role;
    const canUpdate = role === Role.GP || role === Role.FMI || role === Role.FME;
    const isGP = role === Role.GP;
    const log = child({ component: "ReportCard" });

    const [updateOpen, setUpdateOpen] = useState(false);
    const [softDeleteConfirmOpen, setSoftDeleteConfirmOpen] = useState(false);
    const [hardDeleteConfirmOpen, setHardDeleteConfirmOpen] = useState(false);
    const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);

    const [updateReportFile, { isLoading: isUpdating }] = useUpdateReportFileMutation();
    const [downloadReportFile, { isLoading: isDownloading }] = useLazyDownloadReportFileQuery();
    const [softDeleteReport, { isLoading: isSoftDeleting }] = useSoftDeleteReportMutation();
    const [hardDeleteReport, { isLoading: isHardDeleting }] = useHardDeleteReportMutation();
    const [restoreReport, { isLoading: isRestoring }] = useRestoreReportMutation();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<UpdateReportFileFormData>({
        resolver: zodResolver(updateReportFileFormSchema),
    });

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
        "p-4 sm:p-6 divide-y divide-gray-200",
        "hover:ring-1 hover:ring-inset hover:ring-primary",
    );

    async function handleDownload() {
        if (!report.file) {
            log.info({ reportId: report.id }, "Download blocked: no file URL");
            toast.info("Sem arquivo disponível para download.");
            return;
        }
        try {
            await downloadReportFile(report.id).unwrap();
            toast.success("Relatório exportado com sucesso.");
        } catch (err) {
            log.error({ reportId: report.id, error: (err as any)?.message }, "Download failed");
            toast.error("Falha ao baixar o arquivo do relatório.");
        }
    }

    const onSubmit: SubmitHandler<UpdateReportFileFormData> = async (data) => {
        try {
            const file = data.file[0];
            await updateReportFile({ id: report.id, file }).unwrap();
            toast.success("Arquivo do relatório atualizado com sucesso.");
            reset();
            setUpdateOpen(false);
        } catch (err) {
            log.error(
                { reportId: report.id, error: (err as any)?.message },
                "Update report file failed",
            );
            toast.error("Não foi possível atualizar o arquivo do relatório.");
        }
    };

    function handleCloseModal() {
        if (!isUpdating && !isSubmitting) {
            reset();
            setUpdateOpen(false);
        }
    }

    async function handleSoftDelete() {
        try {
            await softDeleteReport({ id: report.id }).unwrap();
            toast.success("Relatório arquivado com sucesso.");
            setSoftDeleteConfirmOpen(false);
            log.info({ reportId: report.id }, "Report soft deleted successfully");
        } catch (err) {
            log.error({ reportId: report.id, error: (err as any)?.message }, "Soft delete failed");
            toast.error("Não foi possível arquivar o relatório.");
        }
    }

    async function handleHardDelete() {
        try {
            await hardDeleteReport({ id: report.id }).unwrap();
            toast.success("Relatório excluído permanentemente.");
            setHardDeleteConfirmOpen(false);
            log.info({ reportId: report.id }, "Report hard deleted successfully");
        } catch (err) {
            log.error({ reportId: report.id, error: (err as any)?.message }, "Hard delete failed");
            toast.error("Não foi possível excluir o relatório permanentemente.");
        }
    }

    async function handleRestore() {
        try {
            await restoreReport({ id: report.id }).unwrap();
            toast.success("Relatório desarquivado com sucesso.");
            setRestoreConfirmOpen(false);
            log.info({ reportId: report.id }, "Report restored successfully");
        } catch (err) {
            log.error({ reportId: report.id, error: (err as any)?.message }, "Restore failed");
            toast.error("Não foi possível desarquivar o relatório.");
        }
    }

    return (
        <div className={containerStyle} data-testid={dataTestId || `report-card-${report.id}`}>
            {/* Header */}
            <div className="flex flex-col gap-1 pb-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Typography element="h3" size="title3">
                        {reportTypeLabel?.[report.report_type] ?? "Relatório"}
                    </Typography>
                    <span
                        className={clsx(
                            "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                            getReportStatusDisplay(report.status).color,
                        )}
                        data-testid="report-status-badge"
                    >
                        {getReportStatusDisplay(report.status).text}
                    </span>
                </div>
            </div>

            {/* Body + Actions */}
            <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <Typography element="p" size="sm" className="sm:text-base">
                        Data de conclusão:{" "}
                        <Typography element="span" className="font-semibold">
                            {completionDateLabel}
                        </Typography>
                    </Typography>
                    <Typography element="p" size="sm" className="sm:text-base">
                        Vencimento:{" "}
                        <Typography element="span" className="font-semibold">
                            {dueDateLabel}
                        </Typography>
                    </Typography>
                </div>

                <div className="flex flex-row flex-wrap gap-2 sm:flex-nowrap">
                    <Button
                        variant="secondary"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex-1 sm:w-auto"
                        data-testid="btn-report-download"
                        aria-label="Baixar relatório"
                        title="Baixar relatório"
                    >
                        <FileArrowDownIcon size={20} />
                    </Button>

                    {canUpdate && !report.is_deleted && (
                        <Button
                            variant="primary"
                            onClick={() => setUpdateOpen(true)}
                            className="flex-1 sm:w-auto"
                            data-testid="btn-report-update"
                            aria-label="Atualizar arquivo do relatório"
                            title="Atualizar arquivo do relatório"
                        >
                            <UploadSimpleIcon size={20} />
                        </Button>
                    )}

                    {isGP && !report.is_deleted && (
                        <Button
                            variant="danger"
                            onClick={() => setSoftDeleteConfirmOpen(true)}
                            className="flex-1 sm:w-auto"
                            data-testid="btn-report-soft-delete"
                            aria-label="Arquivar relatório"
                            title="Arquivar relatório"
                        >
                            <TrashIcon size={20} />
                        </Button>
                    )}

                    {isGP && report.is_deleted && (
                        <>
                            <Button
                                variant="primary"
                                onClick={() => setRestoreConfirmOpen(true)}
                                className="flex-1 sm:w-auto"
                                data-testid="btn-report-restore"
                                aria-label="Desarquivar relatório"
                                title="Desarquivar relatório"
                            >
                                <ArrowCounterClockwiseIcon size={20} />
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => setHardDeleteConfirmOpen(true)}
                                className="flex-1 sm:w-auto"
                                data-testid="btn-report-hard-delete"
                                aria-label="Excluir permanentemente"
                                title="Excluir permanentemente"
                            >
                                <TrashIcon size={20} weight="fill" />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <Modal
                isOpen={updateOpen}
                onClose={handleCloseModal}
                className="max-w-md px-2 py-4 sm:px-6"
            >
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Typography element="h3" size="lg">
                        Atualizar relatório
                    </Typography>

                    <Input
                        {...register("file")}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        errorMessage={errors.file?.message}
                        label="Arquivo do relatório"
                        data-testid="report-file-input"
                    ></Input>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCloseModal}
                            disabled={isUpdating || isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isUpdating || isSubmitting}
                            data-testid="btn-report-update-submit"
                        >
                            {isUpdating || isSubmitting ? "Enviando..." : "Salvar"}
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Soft Delete Confirmation Modal */}
            <Modal
                isOpen={softDeleteConfirmOpen}
                onClose={() => setSoftDeleteConfirmOpen(false)}
                className="max-w-md px-2 py-4 sm:px-6"
            >
                <div className="flex flex-col gap-4">
                    <Typography element="h3" size="lg">
                        Arquivar relatório
                    </Typography>
                    <Typography element="p" size="md">
                        Tem certeza que deseja arquivar este relatório? Ele poderá ser desarquivado
                        posteriormente.
                    </Typography>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setSoftDeleteConfirmOpen(false)}
                            disabled={isSoftDeleting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleSoftDelete}
                            disabled={isSoftDeleting}
                            data-testid="btn-confirm-soft-delete"
                        >
                            {isSoftDeleting ? "Arquivando..." : "Arquivar"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Hard Delete Confirmation Modal */}
            <Modal
                isOpen={hardDeleteConfirmOpen}
                onClose={() => setHardDeleteConfirmOpen(false)}
                className="max-w-md px-2 py-4 sm:px-6"
            >
                <div className="flex flex-col gap-4">
                    <Typography element="h3" size="lg" className="text-red-600">
                        Excluir permanentemente
                    </Typography>
                    <Typography element="p" size="md">
                        <strong>ATENÇÃO:</strong> Esta ação é irreversível! O relatório será
                        excluído permanentemente do banco de dados e não poderá ser recuperado.
                    </Typography>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setHardDeleteConfirmOpen(false)}
                            disabled={isHardDeleting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleHardDelete}
                            disabled={isHardDeleting}
                            data-testid="btn-confirm-hard-delete"
                        >
                            {isHardDeleting ? "Excluindo..." : "Excluir Permanentemente"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Restore Confirmation Modal */}
            <Modal
                isOpen={restoreConfirmOpen}
                onClose={() => setRestoreConfirmOpen(false)}
                className="max-w-md px-2 py-4 sm:px-6"
            >
                <div className="flex flex-col gap-4">
                    <Typography element="h3" size="lg">
                        Desarquivar relatório
                    </Typography>
                    <Typography element="p" size="md">
                        Tem certeza que deseja desarquivar este relatório? Ele voltará a ficar ativo
                        no sistema.
                    </Typography>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setRestoreConfirmOpen(false)}
                            disabled={isRestoring}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleRestore}
                            disabled={isRestoring}
                            data-testid="btn-confirm-restore"
                        >
                            {isRestoring ? "Desarquivando..." : "Desarquivar"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default ReportCard;
