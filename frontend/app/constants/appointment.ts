import AppointmentType, { appointmentTypeLabel } from "@/enums/AppointmentType";

export type AppointmentTypeOption = {
    id: number;
    label: string;
    type: AppointmentType;
};

export const APPOINTMENT_TYPE_OPTIONS: AppointmentTypeOption[] = [
    {
        id: 1,
        label: appointmentTypeLabel[AppointmentType.IN_PERSON],
        type: AppointmentType.IN_PERSON,
    },
    {
        id: 2,
        label: appointmentTypeLabel[AppointmentType.ONLINE],
        type: AppointmentType.ONLINE,
    },
];

export const getAppointmentTypeById = (id: number): AppointmentType => {
    const option = APPOINTMENT_TYPE_OPTIONS.find((o) => o.id === id);
    return option?.type ?? AppointmentType.IN_PERSON;
};
