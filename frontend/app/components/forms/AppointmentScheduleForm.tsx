"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import type {
    AppointmentDTO,
    CreateAppointmentPayload,
    UpdateAppointmentPayload,
} from "@/types/appointment";
import {
    useCreateAppointmentMutation,
    useUpdateAppointmentMutation,
} from "@/redux/features/appointmentApiSlice";

import { appointmentScheduleSchema, makeAppointmentScheduleSchema } from "@/schemas";

import { Form, FormButtons, Input, Select, Textarea } from "@/components/forms";
import { Typography } from "@/components/foundation";
import AppointmentStatus from "@/enums/AppointmentStatus";
import AppointmentType, { appointmentTypeLabel } from "@/enums/AppointmentType";
import { child } from "@/utils/logger";
import type { SelectData } from "@/components/forms/Select";

type AppointmentScheduleFields = z.infer<typeof appointmentScheduleSchema>;

type AppointmentScheduleFormProps = {
    appointment?: AppointmentDTO;
    unitId?: number;
    onCancel: () => void;
    onSuccess: () => void;
    title?: string;
};

function toLocalDatetimeInputValue(iso: string): string {
    try {
        const d = new Date(iso);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const mi = String(d.getMinutes()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    } catch {
        return "";
    }
}

function hasAppointmentScheduleChanges(
    appointment: AppointmentDTO,
    data: AppointmentScheduleFields
): boolean {
    const originalLocalInput = appointment.date ? toLocalDatetimeInputValue(appointment.date) : "";
    const changedDate = data.date !== "" && data.date !== originalLocalInput;

    const trim = (s: string | null | undefined) => (s ?? "").trim();

    const originalName = trim(appointment.contact_name);
    const originalPhone = trim(appointment.contact_phone);
    const originalJustification = trim(appointment.justification as string | null | undefined);
    const originalType = appointment.type;

    const currentName = trim(data.contact_name);
    const currentPhone = trim(data.contact_phone);
    const currentJustification = trim((data as { justification?: string }).justification);
    const currentType = data.type;

    return (
        changedDate ||
        currentName !== originalName ||
        currentPhone !== originalPhone ||
        currentJustification !== originalJustification ||
        currentType !== originalType
    );
}

/**
 * AppointmentScheduleForm component to create or update an appointment schedule.
 *
 * Behavior:
 * - Update mode: when an appointment prop is provided (appointment?.id truthy), performs PATCH to
 *   update date, contact_name, contact_phone, and type.
 * - Create mode: when no appointment prop is provided, requires a unitId and a date, performs POST
 *   to create a new appointment.
 *
 * Props:
 * - appointment?: AppointmentDTO — existing appointment data; if provided, form initializes with
 *   these values and updates them.
 * - unitId?: number — the unit to create the appointment for; required in create mode.
 * - onCancel: () => void — called when the user cancels the form.
 * - onSuccess: () => void — called after successful submit; parent should typically close the modal
 *   here and perform any post-success actions.
 * - title?: string — optional custom title; defaults to "Atualizar agenda" in update mode,
 *   and "Agendar atendimento" in create mode.
 */
const AppointmentScheduleForm = ({
    appointment,
    unitId,
    onCancel,
    onSuccess,
    title,
}: AppointmentScheduleFormProps) => {
    const [updateAppointment] = useUpdateAppointmentMutation();
    const [createAppointment] = useCreateAppointmentMutation();
    const isUpdate = Boolean(appointment?.id);
    const log = child({ component: "AppointmentScheduleForm" });

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<AppointmentScheduleFields>({
        resolver: zodResolver(makeAppointmentScheduleSchema({ requireJustification: isUpdate })),
        defaultValues: {
            date: appointment?.date ? toLocalDatetimeInputValue(appointment.date) : "",
            contact_name: appointment?.contact_name || "",
            contact_phone: appointment?.contact_phone || "",
            type: appointment?.type || AppointmentType.IN_PERSON,
            justification: appointment?.justification ?? "",
        },
    });

    const selectedType = watch("type");

    const onSubmit: SubmitHandler<AppointmentScheduleFields> = async (data) => {
        try {
            const basePayload: Pick<
                CreateAppointmentPayload,
                "contact_name" | "contact_phone" | "type"
            > = {
                contact_name: data.contact_name,
                contact_phone: data.contact_phone,
                type: data.type,
            };

            if (isUpdate && appointment && appointment.id) {
                if (!hasAppointmentScheduleChanges(appointment, data)) {
                    toast.warn("Nenhuma alteração detectada.");
                    return;
                }

                const originalLocalInput = appointment.date
                    ? toLocalDatetimeInputValue(appointment.date)
                    : "";
                const dateChanged = data.date !== "" && data.date !== originalLocalInput;

                const payload: UpdateAppointmentPayload = {
                    ...basePayload,
                    justification: data.justification ?? null,
                };

                if (dateChanged) {
                    payload.date = new Date(data.date!).toISOString();
                    payload.status = AppointmentStatus.RESCHEDULED;
                }

                await updateAppointment({ id: appointment.id, data: payload }).unwrap();

                toast.success("Agenda atualizada com sucesso.");
                onSuccess();
            } else {
                if (!unitId) {
                    log.warn({ unitId }, "AppointmentScheduleForm missing unitId in create mode");
                    toast.error("Unidade inválida para criar agendamento.");
                    return;
                }
                if (!data.date) {
                    log.warn({}, "AppointmentScheduleForm missing date in create mode");
                    toast.error("Data do agendamento é obrigatória.");
                    return;
                }

                const createPayload: CreateAppointmentPayload = {
                    unit: unitId,
                    date: new Date(data.date).toISOString(),
                    contact_name: data.contact_name,
                    contact_phone: data.contact_phone,
                    type: data.type,
                };
                await createAppointment(createPayload).unwrap();

                toast.success("Agendamento criado com sucesso.");
                onSuccess();
            }
        } catch (err) {
            log.error(
                {
                    error:
                        err instanceof Error
                            ? err.message
                            : typeof err === "string"
                              ? err
                              : undefined,
                    mode: isUpdate ? "update" : "create",
                    appointmentId: appointment?.id,
                    unitId,
                },
                "Appointment schedule submit failed"
            );
            toast.error(
                isUpdate
                    ? "Não foi possível atualizar a agenda. Verifique os dados e tente novamente."
                    : "Não foi possível criar o agendamento. Verifique os dados e tente novamente."
            );
        }
    };

    const appointmentTypeOptions: SelectData[] = [
        {
            id: 1,
            value: appointmentTypeLabel[AppointmentType.IN_PERSON],
        },
        {
            id: 2,
            value: appointmentTypeLabel[AppointmentType.ONLINE],
        },
    ];

    const getSelectedTypeData = (): SelectData => {
        if (selectedType === AppointmentType.IN_PERSON) {
            return appointmentTypeOptions[0];
        }
        if (selectedType === AppointmentType.ONLINE) {
            return appointmentTypeOptions[1];
        }
        return appointmentTypeOptions[0];
    };

    const handleTypeChange = (selected: SelectData) => {
        const typeValue = selected.id === 1 ? AppointmentType.IN_PERSON : AppointmentType.ONLINE;
        setValue("type", typeValue, { shouldValidate: true });
    };

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Typography element="h3" size="title3" className="font-semibold">
                    {title ?? (isUpdate ? "Atualizar agenda" : "Agendar atendimento")}
                </Typography>

                <Input
                    {...register("date")}
                    type="datetime-local"
                    errorMessage={errors.date?.message}
                    label="Data/Hora"
                    dataTestId="appointment-date-input"
                ></Input>

                <div className="mb-4">
                    <Select
                        options={appointmentTypeOptions}
                        selectedData={getSelectedTypeData()}
                        setSelect={handleTypeChange}
                        label="Tipo de Agendamento"
                        labelSize="sm"
                        listBoxButtonSize="sm"
                        listOptionSize="sm"
                        dataTestId="appointment-type-select"
                    />
                    {errors.type?.message && (
                        <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                    )}
                </div>

                <Input
                    {...register("contact_name")}
                    type="text"
                    errorMessage={errors.contact_name?.message}
                    placeholder="Nome do contato"
                    label="Nome do contato"
                    dataTestId="appointment-contact-name-input"
                ></Input>

                <Input
                    {...register("contact_phone")}
                    type="text"
                    errorMessage={errors.contact_phone?.message}
                    placeholder="DD9XXXXXXXX"
                    label="Telefone do contato"
                    dataTestId="appointment-contact-phone-input"
                ></Input>

                {isUpdate && (
                    <Textarea
                        {...register("justification")}
                        errorMessage={errors.justification?.message}
                        placeholder="Descreva o motivo do reagendamento"
                        data-testid="appointment-justification-input"
                        rows={4}
                        label="Justificativa"
                    />
                )}

                <FormButtons
                    isSubmitting={isSubmitting}
                    needReview={false}
                    onCancel={onCancel}
                    submitLabel={isUpdate ? "Atualizar" : "Agendar"}
                />
            </Form>
        </div>
    );
};

export default AppointmentScheduleForm;
