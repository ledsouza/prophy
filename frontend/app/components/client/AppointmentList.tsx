"use client";

import { AppointmentCard } from "@/components/client";
import { Typography } from "@/components/foundation";
import type { AppointmentDTO } from "@/types/appointment";

type AppointmentListProps = {
    appointments: AppointmentDTO[];
    emptyStateMessage?: string;
};

function AppointmentList({
    appointments,
    emptyStateMessage = "Nenhum agendamento encontrado",
}: AppointmentListProps) {
    if (!appointments || appointments.length === 0) {
        return (
            <Typography
                element="p"
                size="lg"
                dataTestId="appointment-not-found"
                className="justify-center text-center"
            >
                {emptyStateMessage}
            </Typography>
        );
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            {appointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
        </div>
    );
}

export default AppointmentList;
