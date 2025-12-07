import { SelectData } from "@/components/forms/Select";
import AppointmentStatus, { appointmentStatusLabel } from "@/enums/AppointmentStatus";

export const CLIENT_STATUS_OPTIONS: SelectData[] = [
    { id: 0, value: "Todos" },
    { id: 1, value: "Ativo" },
    { id: 2, value: "Inativo" },
];

export const CONTRACT_TYPE_OPTIONS: SelectData[] = [
    { id: 0, value: "Todos" },
    { id: 1, value: "Anual" },
    { id: 2, value: "Mensal" },
    { id: 3, value: "Semanal" },
];

export const PROPOSAL_STATUS_OPTIONS: SelectData[] = [
    { id: 0, value: "Todos" },
    { id: 1, value: "Aceito" },
    { id: 2, value: "Rejeitado" },
    { id: 3, value: "Pendente" },
];

export const APPOINTMENT_STATUS_OPTIONS: SelectData[] = [
    { id: 0, value: "Todos" },
    { id: 1, value: appointmentStatusLabel[AppointmentStatus.PENDING] },
    { id: 2, value: appointmentStatusLabel[AppointmentStatus.RESCHEDULED] },
    { id: 3, value: appointmentStatusLabel[AppointmentStatus.CONFIRMED] },
    { id: 4, value: appointmentStatusLabel[AppointmentStatus.FULFILLED] },
    { id: 5, value: appointmentStatusLabel[AppointmentStatus.UNFULFILLED] },
];

export const CLIENT_STATUS_MAP: { [key: number]: string } = {
    1: "true",
    2: "false",
};

export const CONTRACT_TYPE_MAP: { [key: number]: string } = {
    1: "A",
    2: "M",
    3: "W",
};

export const PROPOSAL_STATUS_MAP: { [key: number]: string } = {
    1: "A",
    2: "R",
    3: "P",
};

export const APPOINTMENT_STATUS_MAP: { [key: number]: string } = {
    1: AppointmentStatus.PENDING,
    2: AppointmentStatus.RESCHEDULED,
    3: AppointmentStatus.CONFIRMED,
    4: AppointmentStatus.FULFILLED,
    5: AppointmentStatus.UNFULFILLED,
};
