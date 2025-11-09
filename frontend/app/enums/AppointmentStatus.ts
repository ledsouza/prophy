enum AppointmentStatus {
    PENDING = "P",
    RESCHEDULED = "R",
    CONFIRMED = "C",
    FULFILLED = "F",
    UNFULFILLED = "U",
}

export const appointmentStatusLabel: Record<AppointmentStatus, string> = {
    [AppointmentStatus.PENDING]: "Pendente",
    [AppointmentStatus.RESCHEDULED]: "Reagendado",
    [AppointmentStatus.CONFIRMED]: "Confirmado",
    [AppointmentStatus.FULFILLED]: "Realizado",
    [AppointmentStatus.UNFULFILLED]: "Não realizado",
};

export default AppointmentStatus;
