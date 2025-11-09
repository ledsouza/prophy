"use client";

import { AppointmentList } from "@/components/client";
import { Button, ErrorDisplay, Modal, Spinner } from "@/components/common";
import { AppointmentScheduleForm } from "@/components/forms";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import { useListAppointmentsQuery } from "@/redux/features/appointmentApiSlice";
import { child } from "@/utils/logger";
import clsx from "clsx";
import { useState } from "react";

type AppointmentPanelProps = {
    unitId?: number;
    onScheduleAppointment?: () => void;
    scheduleButtonTestId?: string;
    containerClassName?: string;
};

/**
 * AppointmentPanel component for displaying and managing appointments for a specific unit.
 *
 * Layout notes
 * - Intended to be used inside TabbedResourcePanel or another fixed-height flex container.
 * - The root uses min-h-0 and the list is wrapped in a flex-1 overflow-y-auto div so the list
 *   can scroll while the bottom button remains visible.
 *
 * @param unitId - The ID of the unit to fetch appointments for. If not provided, fetches all appointments.
 * @param onScheduleAppointment - Callback invoked when the schedule appointment button is clicked.
 * @param scheduleButtonTestId - Test ID for the schedule appointment button.
 * @param containerClassName - Additional CSS classes to apply to the container div.
 */
function AppointmentPanel({
    unitId,
    onScheduleAppointment,
    scheduleButtonTestId = "btn-schedule-appointment",
    containerClassName = "",
}: AppointmentPanelProps) {
    const {
        data: appointments,
        isLoading,
        error,
    } = useListAppointmentsQuery(unitId ? { unit: unitId } : undefined);

    const [scheduleOpen, setScheduleOpen] = useState(false);
    const { data: user } = useRetrieveUserQuery();
    const allowedRoles = new Set(["GP", "FMI", "C"]);
    const canSchedule = !!user && allowedRoles.has(user.role);
    const log = child({ component: "AppointmentPanel" });

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
                error: (error as any)?.status ?? (error as any)?.message ?? "unknown",
            },
            "Failed to load appointments"
        );
        return (
            <div className={containerClassName}>
                <ErrorDisplay
                    title="Erro ao carregar agendamentos"
                    message="Não foi possível carregar a lista de agendamentos. Tente novamente."
                />
            </div>
        );
    }

    return (
        <div className={clsx("flex flex-col gap-6 h-full min-h-0", containerClassName)}>
            <div className="flex-1 overflow-y-auto [scrollbar-gutter:stable] pr-2">
                <AppointmentList appointments={appointments || []} />
            </div>

            {canSchedule && (
                <Button
                    onClick={onScheduleAppointment ?? (() => setScheduleOpen(true))}
                    data-testid={scheduleButtonTestId}
                >
                    Agendar atendimento
                </Button>
            )}

            <Modal
                isOpen={scheduleOpen}
                onClose={() => setScheduleOpen(false)}
                className="max-w-md px-2 sm:px-6"
            >
                <AppointmentScheduleForm
                    unitId={unitId}
                    onCancel={() => setScheduleOpen(false)}
                    onSuccess={() => setScheduleOpen(false)}
                    title="Agendar atendimento"
                />
            </Modal>
        </div>
    );
}

export default AppointmentPanel;
