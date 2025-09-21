"use client";

import clsx from "clsx";
import { format, parseISO, addDays, startOfDay, isBefore } from "date-fns";
import { useMemo, useState } from "react";

import { Button, Modal } from "@/components/common";
import { VisitScheduleForm, ServiceOrderForm } from "@/components/forms";
import { Typography } from "@/components/foundation";

import VisitStatus, { visitStatusLabel } from "@/enums/VisitStatus";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import type { VisitDTO } from "@/redux/features/visitApiSlice";
import type { ServiceOrderDTO } from "@/redux/features/serviceOrderApiSlice";
import { useDeleteVisitMutation } from "@/redux/features/visitApiSlice";
import {
    useCreateServiceOrderMutation,
    useUpdateServiceOrderMutation,
} from "@/redux/features/serviceOrderApiSlice";

import { formatPhoneNumber } from "@/utils/format";
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

    const [deleteVisit, { isLoading: isDeleting }] = useDeleteVisitMutation();
    const [createServiceOrder, { isLoading: isCreating }] = useCreateServiceOrderMutation();
    const [updateServiceOrder, { isLoading: isUpdatingSO }] = useUpdateServiceOrderMutation();

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
            const scheduled = parseISO(visit.date);
            const cutoff = startOfDay(addDays(scheduled, 1));
            // If now is not before cutoff, rescheduling is disabled
            return !isBefore(new Date(), cutoff);
        } catch {
            // Be safe if parsing fails
            return true;
        }
    }, [visit.date]);

    /**
     * Disables the “Marcar como realizada” action for UNFULFILLED visits.
     * Once a visit is not fulfilled, the correct flow is to create a new visit.
     */
    const isMarkDoneDisabled = useMemo(() => {
        return visit.status === VisitStatus.UNFULFILLED;
    }, [visit.status]);

    // Local modal states
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [soCreateOpen, setSoCreateOpen] = useState(false);

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
            return toast.info("Nenhuma Ordem de Serviço vinculada para exportar.");
        }
        const url = `${process.env.NEXT_PUBLIC_HOST}/api/service-orders/${serviceOrderId}/pdf/`;
        try {
            window.open(url, "_blank", "noopener,noreferrer");
        } catch {
            toast.error("Falha ao abrir o PDF da Ordem de Serviço.");
        }
    }

    async function handleCancelVisit() {
        try {
            if (canDeleteVisit) {
                await deleteVisit(visit.id).unwrap();
                toast.success("Visita cancelada com sucesso.");
                return;
            }
        } catch (err) {
            toast.error("Não foi possível cancelar a visita. Tente novamente.");
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
        } catch {
            toast.error("Não foi possível criar a OS ou atualizar a visita.");
        }
    }

    async function handleUpdateServiceOrder(
        data: Pick<ServiceOrderDTO, "subject" | "description" | "conclusion" | "equipments">
    ) {
        if (!serviceOrderId) {
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
        } catch {
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
                    {!serviceOrderId && canCreateServiceOrder && (
                        <Button
                            variant="success"
                            onClick={() => {
                                if (isMarkDoneDisabled) {
                                    toast.warning(
                                        "Esta visita está não realizada. Agende uma nova visita."
                                    );
                                    return;
                                }
                                setSoCreateOpen(true);
                            }}
                            data-testid="btn-done"
                            aria-label="Marcar como realizada"
                            title={
                                isMarkDoneDisabled
                                    ? "Visita não realizada; não é possível marcar como realizada"
                                    : "Marcar como realizada"
                            }
                            disabled={isCreating || isDeleting || isMarkDoneDisabled}
                        >
                            <CheckCircleIcon size={20} />
                        </Button>
                    )}

                    {canRescheduleVisit && (
                        <Button
                            variant="primary"
                            onClick={() => {
                                if (isRescheduleDisabled) {
                                    toast.warning(
                                        "O prazo para reagendar expirou. Agende uma nova visita."
                                    );
                                    return;
                                }
                                setScheduleOpen(true);
                            }}
                            data-testid="btn-visit-update-schedule"
                            aria-label="Atualizar agenda"
                            title="Atualizar agenda"
                            disabled={isRescheduleDisabled}
                        >
                            <CalendarIcon size={20} />
                        </Button>
                    )}

                    {canDeleteVisit && (
                        <Button
                            variant="danger"
                            onClick={handleCancelVisit}
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
        </div>
    );
}

export default VisitCard;
