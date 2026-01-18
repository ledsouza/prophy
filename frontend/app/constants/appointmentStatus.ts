import type { SelectData } from "@/components/forms/Select";
import AppointmentStatus, { appointmentStatusLabel } from "@/enums/AppointmentStatus";

export const APPOINTMENT_STATUS_OPTIONS: SelectData[] = [
    { id: 0, value: "Todos" },
    { id: 1, value: appointmentStatusLabel[AppointmentStatus.PENDING] },
    { id: 2, value: appointmentStatusLabel[AppointmentStatus.RESCHEDULED] },
    { id: 3, value: appointmentStatusLabel[AppointmentStatus.CONFIRMED] },
    { id: 4, value: appointmentStatusLabel[AppointmentStatus.FULFILLED] },
    { id: 5, value: appointmentStatusLabel[AppointmentStatus.UNFULFILLED] },
];

export const APPOINTMENT_STATUS_MAP: Record<number, AppointmentStatus> = {
    1: AppointmentStatus.PENDING,
    2: AppointmentStatus.RESCHEDULED,
    3: AppointmentStatus.CONFIRMED,
    4: AppointmentStatus.FULFILLED,
    5: AppointmentStatus.UNFULFILLED,
};

export const getAppointmentStatusFromOptionId = (optionId: number): string => {
    return APPOINTMENT_STATUS_MAP[optionId] || "";
};

export const getAppointmentStatusOptionIdFromValue = (value: string | null | undefined): number => {
    if (!value) return 0;
    const entry = Object.entries(APPOINTMENT_STATUS_MAP).find(([_, v]) => v === value);
    return entry ? parseInt(entry[0], 10) : 0;
};

export const getAppointmentStatusClasses = (status: AppointmentStatus): string => {
    switch (status) {
        case AppointmentStatus.PENDING:
            return "bg-warning/10 text-warning";
        case AppointmentStatus.CONFIRMED:
            return "bg-secondary/10 text-secondary";
        case AppointmentStatus.RESCHEDULED:
            return "bg-warning/10 text-warning";
        case AppointmentStatus.FULFILLED:
            return "bg-success/10 text-success";
        case AppointmentStatus.UNFULFILLED:
        default:
            return "bg-danger/10 text-danger";
    }
};
