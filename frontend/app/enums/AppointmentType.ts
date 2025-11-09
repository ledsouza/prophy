enum AppointmentType {
    IN_PERSON = "I",
    ONLINE = "O",
}

export const appointmentTypeLabel: Record<AppointmentType, string> = {
    [AppointmentType.IN_PERSON]: "Presencial",
    [AppointmentType.ONLINE]: "Online",
};

export default AppointmentType;
