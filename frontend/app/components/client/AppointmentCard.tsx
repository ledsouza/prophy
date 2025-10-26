"use client";

import clsx from "clsx";
import { addDays, format, isBefore, parseISO, startOfDay } from "date-fns";
import { useMemo, useState } from "react";

import { Button, Modal } from "@/components/common";
import {
    AppointmentJustificationForm,
    AppointmentScheduleForm,
    ServiceOrderForm,
    Textarea,
} from "@/components/forms";
import { Typography } from "@/components/foundation";

import AppointmentStatus, { appointmentStatusLabel } from "@/enums/AppointmentStatus";
import AppointmentType, { appointmentTypeLabel } from "@/enums/AppointmentType";
import {
    useDeleteAppointmentMutation,
    useUpdateAppointmentMutation,
} from "@/redux/features/appointmentApiSlice";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import {
    useCreateServiceOrderMutation,
    useLazyDownloadServiceOrderPDFQuery,
    useUpdateServiceOrderMutation,
} from "@/redux/features/serviceOrderApiSlice";
import type { AppointmentDTO } from "@/types/appointment";
import type { ServiceOrderDTO, UpdateServiceOrderPayload } from "@/types/service-order";

import { downloadBlob } from "@/utils/download";
import { formatPhoneNumber } from "@/utils/format";
import { child } from "@/utils/logger";
import {
    CalendarIcon,
    CalendarXIcon,
    CheckCircleIcon,
    FileArrowDownIcon,
    MonitorPlay,
    Users,
} from "@phosphor-icons/react";
import { toast } from "react-toastify";

const statusColorClass: Record<AppointmentStatus, string> = {
    [AppointmentStatus.PENDING]: "text-warning",
    [AppointmentStatus.RESCHEDULED]: "text-warning",
    [AppointmentStatus.CONFIRMED]: "text-success",
    [AppointmentStatus.FULFILLED]: "text-success",
    [AppointmentStatus.UNFULFILLED]: "text-danger",
};

type AppointmentCardProps = {
    appointment: AppointmentDTO;
    dataTestId?: string;
};

/**
 * Displays appointment information in a card with contextual actions and modals.
 *
 * @remarks
 * Actions available to the user:
 * - View Service Order details (opens a modal) when a Service Order is linked
 * - Export Service Order as PDF
 * - Generate Service Order (placeholder; no backend endpoint)
 * - Update appointment schedule (opens a modal and performs PATCH)
 * - Only GP is authorized to delete an appointment.
 *   FMI can only reschedule an appointment. Others can only view.
 *
 * The component uses toast notifications for feedback and guards actions based on
 * the authenticated user's role obtained from the auth store.
 *
 * @returns A React element representing the appointment card UI.
 *
 * @example
 * ```tsx
 * <AppointmentCard appointment={appointment} dataTestId="appointment-1" />
 * ```
 */
function AppointmentCard({ appointment, dataTestId }: AppointmentCardProps) {
    const { data: userData } = useRetrieveUserQuery();
    const role = userData?.role;
    const canDeleteAppointment = role === "GP";
    const canRescheduleAppointment = role === "FMI" || role === "GP";
    const canUpdateServiceOrder = role === "GP";
    const canCreateServiceOrder = role === "GP" || role === "FMI" || role === "FME";
    const canConfirmAppointment = role === "GP" || role === "FMI" || role === "FME" || role === "C";
    const canJustifyAppointment = role === "FMI" || role === "FME";
    const canEditUpdates = role === "GP" || role === "FMI" || role === "FME";
    const log = child({ component: "AppointmentCard" });
    const showCreateServiceOrderButton =
        canCreateServiceOrder && appointment.status === AppointmentStatus.CONFIRMED;
    const showConfirmAppointmentButton =
        canConfirmAppointment &&
        (appointment.status === AppointmentStatus.PENDING ||
            appointment.status === AppointmentStatus.RESCHEDULED);
    const showJustifyButton =
        canJustifyAppointment && appointment.status === AppointmentStatus.UNFULFILLED;
    const canViewJustification = role === "GP";
    const showJustificationViewerButton =
        canViewJustification &&
        (appointment.status === AppointmentStatus.UNFULFILLED ||
            appointment.status === AppointmentStatus.RESCHEDULED);

    const [deleteAppointment, { isLoading: isDeleting }] = useDeleteAppointmentMutation();
    const [createServiceOrder, { isLoading: isCreating }] = useCreateServiceOrderMutation();
    const [updateServiceOrder, { isLoading: isUpdatingSO }] = useUpdateServiceOrderMutation();
    const [updateAppointment, { isLoading: isUpdatingAppointment }] =
        useUpdateAppointmentMutation();
    const [downloadServiceOrderPDF, { isLoading: isDownloadingSO }] =
        useLazyDownloadServiceOrderPDFQuery();

    const serviceOrderId = appointment.service_order?.id;

    const dateLabel = useMemo(() => {
        try {
            const d = parseISO(appointment.date);
            return format(d, "dd/MM/yyyy HH:mm");
        } catch {
            return appointment.date;
        }
    }, [appointment.date]);

    const isRescheduleDisabled = useMemo(() => {
        if (appointment.status === AppointmentStatus.FULFILLED) return true;
        const scheduled = parseISO(appointment.date);
        const cutoff = startOfDay(addDays(scheduled, 1));
        return !isBefore(new Date(), cutoff);
    }, [appointment.date, appointment.status]);

    /**
     * Disables the "Marcar como realizada" action for UNFULFILLED or FULFILLED appointments.
     * Once an appointment is unfulfilled (missed) or already fulfilled, it cannot be marked as done again.
     */
    const isMarkDoneDisabled = useMemo(() => {
        return (
            appointment.status === AppointmentStatus.UNFULFILLED ||
            appointment.status === AppointmentStatus.FULFILLED
        );
    }, [appointment.status]);

    // Local modal states
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [soCreateOpen, setSoCreateOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [justificationOpen, setJustificationOpen] = useState(false);
    const [justificationViewerOpen, setJustificationViewerOpen] = useState(false);

    /**
     * Downloads the Service Order PDF.
     *
     * @remarks
     * Shows an informational toast if there is no linked Service Order.
     * Downloads the file as a blob and triggers a browser download.
     */
    async function handleExportServiceOrder() {
        if (!serviceOrderId) {
            log.info({ appointmentId: appointment.id }, "Export blocked: no service order");
            return toast.info("Nenhuma Ordem de Serviço vinculada para exportar.");
        }

        try {
            const blob = await downloadServiceOrderPDF(serviceOrderId).unwrap();
            const filename = `service_order_${serviceOrderId}.pdf`;
            downloadBlob(blob, filename);
            log.info(
                { appointmentId: appointment.id, serviceOrderId, filename },
                "SO PDF exported successfully"
            );
            toast.success("Ordem de Serviço exportada com sucesso.");
        } catch (err) {
            log.error(
                { appointmentId: appointment.id, serviceOrderId, error: (err as any)?.message },
                "Export service order failed"
            );
            toast.error("Falha ao exportar o PDF da Ordem de Serviço.");
        }
    }

    async function handleCancelAppointment() {
        try {
            if (canDeleteAppointment) {
                await deleteAppointment(appointment.id).unwrap();
                setDeleteOpen(false);
                toast.success("Agendamento cancelado com sucesso.");
                return;
            }
        } catch (err) {
            log.error(
                { appointmentId: appointment.id, error: (err as any)?.message },
                "Cancel appointment failed"
            );
            toast.error("Não foi possível cancelar o agendamento. Tente novamente.");
        }
    }

    async function handleConfirmAppointment() {
        try {
            await updateAppointment({
                id: appointment.id,
                data: { status: AppointmentStatus.CONFIRMED },
            }).unwrap();
            toast.success("Agendamento confirmado com sucesso.");
            setConfirmOpen(false);
        } catch (err) {
            log.error(
                { appointmentId: appointment.id, error: (err as any)?.message },
                "Confirm appointment failed"
            );
            toast.error("Não foi possível confirmar o agendamento. Tente novamente.");
        }
    }

    async function handleCreateServiceOrder(
        data: Pick<ServiceOrderDTO, "subject" | "description" | "conclusion" | "equipments">
    ) {
        try {
            await createServiceOrder({
                visit: appointment.id,
                subject: data.subject,
                description: data.description,
                conclusion: data.conclusion,
                equipments: data.equipments || [],
            }).unwrap();
            toast.success("Ordem de Serviço criada e agendamento marcado como realizado.");
            setSoCreateOpen(false);
        } catch (err) {
            log.error(
                { appointmentId: appointment.id, error: (err as any)?.message },
                "Create service order failed"
            );
            toast.error("Não foi possível criar a OS ou atualizar o agendamento.");
        }
    }

    // Builds a payload based on the user's role.
    // - GP: full payload; includes updates only if it differs from the current value
    // - FMI/FME: updates-only; skips PATCH if no change
    // - others: denied
    const buildPayloadByRole = (
        role: string | undefined,
        data: Pick<
            ServiceOrderDTO,
            "subject" | "description" | "conclusion" | "equipments" | "updates"
        >,
        currentUpdates: string | null
    ): { payload?: UpdateServiceOrderPayload; skip?: boolean; deny?: boolean } => {
        if (role === "GP") {
            const payload: UpdateServiceOrderPayload = {
                subject: data.subject,
                description: data.description,
                conclusion: data.conclusion,
                equipments: data.equipments || [],
            };
            if (typeof data.updates !== "undefined" && data.updates !== currentUpdates) {
                payload.updates = data.updates;
            }
            return { payload };
        }
        if (role === "FMI" || role === "FME") {
            const next = data.updates ?? null;
            if (next === currentUpdates) return { skip: true };
            return { payload: { updates: next } };
        }
        return { deny: true };
    };

    async function handleUpdateServiceOrder(
        data: Pick<
            ServiceOrderDTO,
            "subject" | "description" | "conclusion" | "equipments" | "updates"
        >
    ) {
        if (!serviceOrderId) {
            log.warn(
                { appointmentId: appointment.id },
                "Update service order blocked: no Service Order linked"
            );
            toast.info("Sem ordem de serviço vinculada.");
            return;
        }
        try {
            const current = appointment.service_order?.updates ?? null;
            const result = buildPayloadByRole(role, data, current);

            if (result.deny) {
                toast.info("Sem permissão para atualizar a Ordem de Serviço.");
                return;
            }
            if (result.skip) {
                toast.info("Sem alterações em Atualizações.");
                return;
            }

            await updateServiceOrder({
                id: serviceOrderId,
                data: result.payload!,
            }).unwrap();

            toast.success("Ordem de Serviço atualizada com sucesso.");
            setDetailsOpen(false);
        } catch (err) {
            log.error(
                { appointmentId: appointment.id, serviceOrderId, error: (err as any)?.message },
                "Update service order failed"
            );
            toast.error("Não foi possível atualizar a Ordem de Serviço.");
        }
    }

    const appointmentTypeIcon =
        appointment.type === AppointmentType.ONLINE ? (
            <MonitorPlay size={20} weight="duotone" />
        ) : (
            <Users size={20} weight="duotone" />
        );

    const containerStyle = clsx(
        "bg-light rounded-xl shadow-sm",
        "p-6 divide-y-2",
        "hover:ring-1 hover:ring-inset hover:ring-primary"
    );

    return (
        <div
            className={containerStyle}
            data-testid={dataTestId || `appointment-card-${appointment.id}`}
        >
            <div className="flex justify-between pb-4">
                {/* date and contact info */}
                <div className="flex flex-col">
                    <Typography element="h3" size="title3">
                        {dateLabel}
                    </Typography>

                    <div className="mt-1 text-left">
                        <Typography element="p" size="sm">
                            Contato:
                        </Typography>
                        <Typography element="p" size="md">
                            {appointment.contact_name}
                        </Typography>
                        <Typography element="p" size="md">
                            {formatPhoneNumber(appointment.contact_phone)}
                        </Typography>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        {appointmentTypeIcon}
                        <Typography element="p" size="md" className="font-medium">
                            {appointmentTypeLabel[appointment.type]}
                        </Typography>
                    </div>
                </div>

                {/* label and status */}
                <div className="flex flex-col gap-2 items-end">
                    <Typography element="h3" size="lg" className="text-right">
                        Situação
                    </Typography>
                    <Typography
                        element="p"
                        size="sm"
                        className={clsx("font-medium", statusColorClass[appointment.status])}
                        dataTestId="appointment-status"
                    >
                        {appointmentStatusLabel[appointment.status]}
                    </Typography>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between pt-4 gap-2">
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="secondary"
                        onClick={() =>
                            serviceOrderId
                                ? setDetailsOpen(true)
                                : toast.info("Sem ordem de serviço vinculada.")
                        }
                        disabled={!serviceOrderId}
                        data-testid="btn-so-details"
                    >
                        Ordem de Serviço
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={handleExportServiceOrder}
                        disabled={!serviceOrderId || isDownloadingSO}
                        data-testid="btn-so-export"
                        aria-label="Exportar Ordem de Serviço"
                        title="Exportar Ordem de Serviço"
                    >
                        <FileArrowDownIcon size={20} />
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {showCreateServiceOrderButton && (
                        <Button
                            variant="success"
                            onClick={() => {
                                setSoCreateOpen(true);
                            }}
                            data-testid="btn-done"
                            aria-label="Marcar como realizada"
                            title={
                                appointment.status === AppointmentStatus.FULFILLED
                                    ? "Agendamento já realizado; não é possível marcar como realizado"
                                    : appointment.status === AppointmentStatus.UNFULFILLED
                                      ? "Agendamento não realizado; não é possível marcar como realizado"
                                      : "Marcar como realizado"
                            }
                            disabled={isCreating || isDeleting || isMarkDoneDisabled}
                        >
                            <CheckCircleIcon size={20} />
                        </Button>
                    )}

                    {showConfirmAppointmentButton && (
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setConfirmOpen(true);
                            }}
                            data-testid="btn-appointment-confirm"
                            aria-label="Confirmar agendamento"
                            title="Confirmar agendamento"
                            disabled={isUpdatingAppointment || isDeleting}
                        >
                            Confirmar
                        </Button>
                    )}
                    {showJustifyButton && (
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setJustificationOpen(true);
                            }}
                            data-testid="btn-appointment-justify"
                            disabled={isUpdatingAppointment || isDeleting}
                        >
                            Justificar
                        </Button>
                    )}
                    {showJustificationViewerButton && (
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setJustificationViewerOpen(true);
                            }}
                            data-testid="btn-appointment-justification-viewer"
                        >
                            Justificativa
                        </Button>
                    )}
                    {canRescheduleAppointment && (
                        <Button
                            variant="primary"
                            onClick={() => {
                                setScheduleOpen(true);
                            }}
                            data-testid="btn-appointment-update-schedule"
                            aria-label="Reagendar"
                            title={
                                appointment.status === AppointmentStatus.FULFILLED
                                    ? "Agendamento já realizado; não é possível reagendar"
                                    : "Reagendar"
                            }
                            disabled={isRescheduleDisabled}
                        >
                            <CalendarIcon size={20} />
                        </Button>
                    )}

                    {canDeleteAppointment && (
                        <Button
                            variant="danger"
                            onClick={() => {
                                setDeleteOpen(true);
                            }}
                            data-testid="btn-appointment-cancel-schedule"
                            disabled={isDeleting}
                            aria-label="Cancelar agenda"
                            title="Cancelar agenda"
                        >
                            <CalendarXIcon size={20} />
                        </Button>
                    )}
                </div>
            </div>

            <Modal
                isOpen={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                className="sm:max-w-4xl"
            >
                {appointment.service_order && (
                    <ServiceOrderForm
                        serviceOrder={appointment.service_order}
                        unitId={appointment.unit}
                        disabled={!canUpdateServiceOrder}
                        onCancel={() => setDetailsOpen(false)}
                        onSubmit={handleUpdateServiceOrder}
                        canEditUpdates={canEditUpdates}
                        title="Detalhes da Ordem de Serviço"
                    />
                )}
            </Modal>

            <Modal
                isOpen={soCreateOpen}
                onClose={() => setSoCreateOpen(false)}
                className="sm:max-w-4xl"
            >
                <ServiceOrderForm
                    serviceOrder={
                        {
                            id: 0,
                            subject: "",
                            description: "",
                            conclusion: "",
                            updates: "",
                            equipments: [],
                        } as ServiceOrderDTO
                    }
                    unitId={appointment.unit}
                    onCancel={() => setSoCreateOpen(false)}
                    onSubmit={handleCreateServiceOrder}
                    showUpdatesField={false}
                    title="Gerar Ordem de Serviço"
                />
            </Modal>

            <Modal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                className="max-w-md px-2 py-6 sm:px-6 sm:py-6"
            >
                <div className="space-y-4">
                    <Typography element="h3" size="lg">
                        Confirmar agendamento
                    </Typography>
                    <Typography element="p" size="md">
                        Deseja confirmar este agendamento?
                    </Typography>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setConfirmOpen(false)}
                            disabled={isUpdatingAppointment}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleConfirmAppointment}
                            disabled={isUpdatingAppointment}
                            data-testid="btn-appointment-confirm-submit"
                        >
                            Confirmar
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                className="max-w-md px-2 py-6 sm:px-6 sm:py-6"
            >
                <div className="space-y-4">
                    <Typography element="h3" size="lg">
                        Cancelar agenda
                    </Typography>
                    <Typography element="p" size="md">
                        Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser
                        desfeita.
                    </Typography>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setDeleteOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleCancelAppointment}
                            disabled={isDeleting}
                            data-testid="btn-appointment-cancel-submit"
                        >
                            Confirmar
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={scheduleOpen}
                onClose={() => setScheduleOpen(false)}
                className="max-w-md px-2 sm:px-6"
            >
                <AppointmentScheduleForm
                    appointment={appointment}
                    onCancel={() => setScheduleOpen(false)}
                    onSuccess={() => setScheduleOpen(false)}
                />
            </Modal>

            <Modal
                isOpen={justificationOpen}
                onClose={() => setJustificationOpen(false)}
                className="max-w-md px-2 sm:px-6"
            >
                <AppointmentJustificationForm
                    appointmentId={appointment.id}
                    initialJustification={appointment.justification}
                    onCancel={() => setJustificationOpen(false)}
                    onSuccess={() => setJustificationOpen(false)}
                />
            </Modal>

            <Modal
                isOpen={justificationViewerOpen}
                onClose={() => setJustificationViewerOpen(false)}
                className="max-w-md px-2 py-6 sm:px-6 sm:py-6"
            >
                <div className="space-y-4">
                    <Typography element="h3" size="lg">
                        Justificativa
                    </Typography>
                    {appointment.justification ? (
                        <Textarea disabled value={appointment.justification} rows={6} />
                    ) : (
                        <Typography element="p" size="md">
                            Sem justificativa informada.
                        </Typography>
                    )}
                    <div className="flex justify-end">
                        <Button
                            variant="secondary"
                            onClick={() => setJustificationViewerOpen(false)}
                        >
                            Fechar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default AppointmentCard;
