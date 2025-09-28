"use client";

import clsx from "clsx";
import { format, parseISO, addDays, startOfDay, isBefore } from "date-fns";
import { useMemo, useState } from "react";

import { Button, Modal } from "@/components/common";
import { VisitScheduleForm, ServiceOrderForm, VisitJustificationForm } from "@/components/forms";
import { Typography } from "@/components/foundation";

import VisitStatus, { visitStatusLabel } from "@/enums/VisitStatus";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import type { VisitDTO } from "@/types/visit";
import type { ServiceOrderDTO } from "@/redux/features/serviceOrderApiSlice";
import { useDeleteVisitMutation, useUpdateVisitMutation } from "@/redux/features/visitApiSlice";
import {
    useCreateServiceOrderMutation,
    useUpdateServiceOrderMutation,
} from "@/redux/features/serviceOrderApiSlice";

import { formatPhoneNumber } from "@/utils/format";
import { child } from "@/utils/logger";
import {
    CalendarIcon,
    CalendarXIcon,
    FileArrowDownIcon,
    CheckCircleIcon,
} from "@phosphor-icons/react";
import { toast } from "react-toastify";

const statusColorClass: Record<VisitStatus, string> = {
    [VisitStatus.PENDING]: "text-warning",
    [VisitStatus.RESCHEDULED]: "text-warning",
    [VisitStatus.CONFIRMED]: "text-success",
    [VisitStatus.FULFILLED]: "text-success",
    [VisitStatus.UNFULFILLED]: "text-danger",
};

type VisitCardProps = {
    visit: VisitDTO;
    dataTestId?: string;
};

/**
 * Displays visit information in a card with contextual actions and modals.
 *
 * @remarks
 * Actions available to the user:
 * - View Service Order details (opens a modal) when a Service Order is linked
 * - Export Service Order as PDF
 * - Generate Service Order (placeholder; no backend endpoint)
 * - Update visit schedule (opens a modal and performs PATCH)
 * - Only GP is authorized to delete a visit.
 *   FMI can only reschedule a visit. Others can only view.
 *
 * The component uses toast notifications for feedback and guards actions based on
 * the authenticated user's role obtained from the auth store.
 *
 * @returns A React element representing the visit card UI.
 *
 * @example
 * ```tsx
 * <VisitCard visit={visit} dataTestId="visit-1" />
 * ```
 */
function VisitCard({ visit, dataTestId }: VisitCardProps) {
    const { data: userData } = useRetrieveUserQuery();
    const role = userData?.role;
    const canDeleteVisit = role === "GP";
    const canRescheduleVisit = role === "FMI" || role === "GP";
    const canUpdateServiceOrder = role === "GP";
    const canCreateServiceOrder = role === "GP" || role === "FMI" || role === "FME";
    const canConfirmVisit = role === "GP" || role === "FMI" || role === "FME" || role === "C";
    const canJustifyVisit = role === "FMI" || role === "FME";
    const log = child({ component: "VisitCard" });
    const showCreateServiceOrderButton =
        canCreateServiceOrder && visit.status === VisitStatus.CONFIRMED;
    const showConfirmVisitButton =
        canConfirmVisit &&
        (visit.status === VisitStatus.PENDING || visit.status === VisitStatus.RESCHEDULED);
    const showJustifyButton = canJustifyVisit && visit.status === VisitStatus.UNFULFILLED;

    const [deleteVisit, { isLoading: isDeleting }] = useDeleteVisitMutation();
    const [createServiceOrder, { isLoading: isCreating }] = useCreateServiceOrderMutation();
    const [updateServiceOrder, { isLoading: isUpdatingSO }] = useUpdateServiceOrderMutation();
    const [updateVisit, { isLoading: isUpdatingVisit }] = useUpdateVisitMutation();

    const serviceOrderId = visit.service_order?.id;

    const dateLabel = useMemo(() => {
        try {
            const d = parseISO(visit.date);
            return format(d, "dd/MM/yyyy HH:mm");
        } catch {
            return visit.date;
        }
    }, [visit.date]);

    const isRescheduleDisabled = useMemo(() => {
        try {
            if (visit.status === VisitStatus.FULFILLED) return true;
            const scheduled = parseISO(visit.date);
            const cutoff = startOfDay(addDays(scheduled, 1));
            // If now is not before cutoff, rescheduling is disabled
            return !isBefore(new Date(), cutoff);
        } catch {
            // Be safe if parsing fails
            return true;
        }
    }, [visit.date, visit.status]);

    /**
     * Disables the “Marcar como realizada” action for UNFULFILLED or FULFILLED visits.
     * Once a visit is unfulfilled (missed) or already fulfilled, it cannot be marked as done again.
     */
    const isMarkDoneDisabled = useMemo(() => {
        return visit.status === VisitStatus.UNFULFILLED || visit.status === VisitStatus.FULFILLED;
    }, [visit.status]);

    // Local modal states
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [soCreateOpen, setSoCreateOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [justificationOpen, setJustificationOpen] = useState(false);

    // Export PDF of Service Order
    /**
     * Opens the Service Order PDF in a new browser tab.
     *
     * @remarks
     * Shows an informational toast if there is no linked Service Order. If the
     * window fails to open (e.g., popup blocked), an error toast is displayed.
     */
    function handleExportServiceOrder() {
        if (!serviceOrderId) {
            log.info({ visitId: visit.id }, "Export blocked: no service order");
            return toast.info("Nenhuma Ordem de Serviço vinculada para exportar.");
        }
        const url = `${process.env.NEXT_PUBLIC_HOST}/api/service-orders/${serviceOrderId}/pdf/`;
        try {
            window.open(url, "_blank", "noopener,noreferrer");
        } catch (err) {
            log.error(
                { visitId: visit.id, serviceOrderId, error: (err as any)?.message },
                "Export service order failed"
            );
            toast.error("Falha ao abrir o PDF da Ordem de Serviço.");
        }
    }

    async function handleCancelVisit() {
        try {
            if (canDeleteVisit) {
                await deleteVisit(visit.id).unwrap();
                setDeleteOpen(false);
                toast.success("Visita cancelada com sucesso.");
                return;
            }
        } catch (err) {
            log.error({ visitId: visit.id, error: (err as any)?.message }, "Cancel visit failed");
            toast.error("Não foi possível cancelar a visita. Tente novamente.");
        }
    }

    async function handleConfirmVisit() {
        try {
            await updateVisit({ id: visit.id, data: { status: VisitStatus.CONFIRMED } }).unwrap();
            toast.success("Visita confirmada com sucesso.");
            setConfirmOpen(false);
        } catch (err) {
            log.error({ visitId: visit.id, error: (err as any)?.message }, "Confirm visit failed");
            toast.error("Não foi possível confirmar a visita. Tente novamente.");
        }
    }

    async function handleCreateServiceOrder(
        data: Pick<ServiceOrderDTO, "subject" | "description" | "conclusion" | "equipments">
    ) {
        try {
            await createServiceOrder({
                visit: visit.id,
                subject: data.subject,
                description: data.description,
                conclusion: data.conclusion,
                equipments: data.equipments || [],
            }).unwrap();
            toast.success("Ordem de Serviço criada e visita marcada como realizada.");
            setSoCreateOpen(false);
        } catch (err) {
            log.error(
                { visitId: visit.id, error: (err as any)?.message },
                "Create service order failed"
            );
            toast.error("Não foi possível criar a OS ou atualizar a visita.");
        }
    }

    async function handleUpdateServiceOrder(
        data: Pick<ServiceOrderDTO, "subject" | "description" | "conclusion" | "equipments">
    ) {
        if (!serviceOrderId) {
            log.warn({ visitId: visit.id }, "Update service order blocked: no SO linked");
            toast.info("Sem ordem de serviço vinculada.");
            return;
        }
        try {
            await updateServiceOrder({
                id: serviceOrderId,
                data: {
                    subject: data.subject,
                    description: data.description,
                    conclusion: data.conclusion,
                    equipments: data.equipments || [],
                },
            }).unwrap();
            toast.success("Ordem de Serviço atualizada com sucesso.");
            setDetailsOpen(false);
        } catch (err) {
            log.error(
                { visitId: visit.id, serviceOrderId, error: (err as any)?.message },
                "Update service order failed"
            );
            toast.error("Não foi possível atualizar a Ordem de Serviço.");
        }
    }

    const containerStyle = clsx(
        "bg-light rounded-xl shadow-sm",
        "p-6 divide-y-2",
        "hover:ring-1 hover:ring-inset hover:ring-primary"
    );

    return (
        <div className={containerStyle} data-testid={dataTestId || `visit-card-${visit.id}`}>
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
                            {visit.contact_name}
                        </Typography>
                        <Typography element="p" size="md">
                            {formatPhoneNumber(visit.contact_phone)}
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
                        className={clsx("font-medium", statusColorClass[visit.status])}
                        dataTestId="visit-status"
                    >
                        {visitStatusLabel[visit.status]}
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
                        disabled={!serviceOrderId}
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
                                visit.status === VisitStatus.FULFILLED
                                    ? "Visita já realizada; não é possível marcar como realizada"
                                    : visit.status === VisitStatus.UNFULFILLED
                                      ? "Visita não realizada; não é possível marcar como realizada"
                                      : "Marcar como realizada"
                            }
                            disabled={isCreating || isDeleting || isMarkDoneDisabled}
                        >
                            <CheckCircleIcon size={20} />
                        </Button>
                    )}

                    {showConfirmVisitButton && (
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setConfirmOpen(true);
                            }}
                            data-testid="btn-visit-confirm"
                            aria-label="Confirmar visita"
                            title="Confirmar visita"
                            disabled={isUpdatingVisit || isDeleting}
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
                            data-testid="btn-visit-justify"
                            disabled={isUpdatingVisit || isDeleting}
                        >
                            Justificar
                        </Button>
                    )}
                    {canRescheduleVisit && (
                        <Button
                            variant="primary"
                            onClick={() => {
                                setScheduleOpen(true);
                            }}
                            data-testid="btn-visit-update-schedule"
                            aria-label="Reagendar"
                            title={
                                visit.status === VisitStatus.FULFILLED
                                    ? "Visita já realizada; não é possível reagendar"
                                    : "Reagendar"
                            }
                            disabled={isRescheduleDisabled}
                        >
                            <CalendarIcon size={20} />
                        </Button>
                    )}

                    {canDeleteVisit && (
                        <Button
                            variant="danger"
                            onClick={() => {
                                setDeleteOpen(true);
                            }}
                            data-testid="btn-visit-cancel-schedule"
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
                {visit.service_order && (
                    <ServiceOrderForm
                        serviceOrder={visit.service_order}
                        unitId={visit.unit}
                        disabled={!canUpdateServiceOrder}
                        onCancel={() => setDetailsOpen(false)}
                        onSubmit={handleUpdateServiceOrder}
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
                            equipments: [],
                        } as ServiceOrderDTO
                    }
                    unitId={visit.unit}
                    onCancel={() => setSoCreateOpen(false)}
                    onSubmit={handleCreateServiceOrder}
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
                        Confirmar visita
                    </Typography>
                    <Typography element="p" size="md">
                        Deseja confirmar esta visita?
                    </Typography>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setConfirmOpen(false)}
                            disabled={isUpdatingVisit}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleConfirmVisit}
                            disabled={isUpdatingVisit}
                            data-testid="btn-visit-confirm-submit"
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
                        Tem certeza que deseja cancelar esta visita? Esta ação não pode ser
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
                            onClick={handleCancelVisit}
                            disabled={isDeleting}
                            data-testid="btn-visit-cancel-submit"
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
                <VisitScheduleForm
                    visit={visit}
                    onCancel={() => setScheduleOpen(false)}
                    onSuccess={() => setScheduleOpen(false)}
                />
            </Modal>

            <Modal
                isOpen={justificationOpen}
                onClose={() => setJustificationOpen(false)}
                className="max-w-md px-2 sm:px-6"
            >
                <VisitJustificationForm
                    visitId={visit.id}
                    initialJustification={visit.justification}
                    onCancel={() => setJustificationOpen(false)}
                    onSuccess={() => setJustificationOpen(false)}
                />
            </Modal>
        </div>
    );
}

export default VisitCard;
