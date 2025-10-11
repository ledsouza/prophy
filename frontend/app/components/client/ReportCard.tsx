"use client";

import clsx from "clsx";
import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button, Modal } from "@/components/common";
import { Input } from "@/components/forms";
import { Typography } from "@/components/foundation";

import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import {
    useUpdateReportFileMutation,
    useLazyDownloadReportFileQuery,
} from "@/redux/features/reportApiSlice";
import type { ReportDTO } from "@/types/report";
import { reportTypeLabel } from "@/types/report";
import { reportFileSchema } from "@/schemas";

import { child } from "@/utils/logger";
import { downloadBlob, extractFilenameFromPath } from "@/utils/download";
import { FileArrowDownIcon, UploadSimpleIcon } from "@phosphor-icons/react";
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
    const canUpdate = role === "GP" || role === "FMI" || role === "FME";
    const log = child({ component: "ReportCard" });

    const [updateOpen, setUpdateOpen] = useState(false);
    const [updateReportFile, { isLoading: isUpdating }] = useUpdateReportFileMutation();
    const [downloadReportFile, { isLoading: isDownloading }] = useLazyDownloadReportFileQuery();

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
        "p-6 divide-y-2",
        "hover:ring-1 hover:ring-inset hover:ring-primary"
    );

    async function handleDownload() {
        if (!report.file) {
            log.info({ reportId: report.id }, "Download blocked: no file URL");
            toast.info("Sem arquivo disponível para download.");
            return;
        }
        try {
            const blob = await downloadReportFile(report.id).unwrap();
            const filename = extractFilenameFromPath(report.file, "report", report.id);
            downloadBlob(blob, filename);
            log.info({ reportId: report.id, filename }, "Report file downloaded successfully");
            toast.success("Relatório baixado com sucesso.");
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
                "Update report file failed"
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

    return (
        <div className={containerStyle} data-testid={dataTestId || `report-card-${report.id}`}>
            {/* Header */}
            <div className="flex flex-col gap-1 pb-4">
                <Typography element="h3" size="title3">
                    {reportTypeLabel?.[report.report_type] ?? "Relatório"}
                </Typography>
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
                        disabled={isDownloading}
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

            <Modal isOpen={updateOpen} onClose={handleCloseModal} className="max-w-md px-2 sm:px-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Typography element="h3" size="lg">
                        Atualizar arquivo do relatório
                    </Typography>

                    <Input
                        {...register("file")}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        errorMessage={errors.file?.message}
                        data-testid="report-file-input"
                    >
                        Arquivo do relatório
                    </Input>

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
                </form>
            </Modal>
        </div>
    );
}

export default ReportCard;
