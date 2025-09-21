"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import type { VisitDTO } from "@/redux/features/visitApiSlice";
import { useCreateVisitMutation, useUpdateVisitMutation } from "@/redux/features/visitApiSlice";

import { visitScheduleSchema } from "@/schemas";

import { Form, FormButtons, Input } from "@/components/forms";
import { Typography } from "@/components/foundation";

type VisitScheduleFields = z.infer<typeof visitScheduleSchema>;

type VisitScheduleFormProps = {
    visit?: VisitDTO;
    unitId?: number;
    onCancel: () => void;
    onSuccess?: () => void;
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

/**
 * VisitScheduleForm component to create or update a visit schedule.
 *
 * Behavior:
 * - Update mode: when a visit prop is provided (visit?.id truthy), performs PATCH to update date,
 *   contact_name and contact_phone.
 * - Create mode: when no visit prop is provided, requires a unitId and a date, performs POST to create
 *   a new visit.
 *
 * Props:
 * - visit?: VisitDTO — existing visit data; if provided, form initializes with these values and updates them.
 * - unitId?: number — the unit to create the visit for; required in create mode.
 * - onCancel: () => void — called when the user cancels the form (does NOT run on successful submit).
 * - onSuccess?: () => void — called after successful submit; parent should typically close the modal here and perform any post-success actions (e.g., refresh lists).
 * - title?: string — optional custom title; defaults to "Atualizar agenda" in update mode,
 *   and "Agendar visita" in create mode.
 */
const VisitScheduleForm = ({
    visit,
    unitId,
    onCancel,
    onSuccess,
    title,
}: VisitScheduleFormProps) => {
    const [updateVisit] = useUpdateVisitMutation();
    const [createVisit] = useCreateVisitMutation();
    const isUpdate = Boolean(visit?.id);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<VisitScheduleFields>({
        resolver: zodResolver(visitScheduleSchema),
        defaultValues: {
            date: visit?.date ? toLocalDatetimeInputValue(visit.date) : "",
            contact_name: visit?.contact_name || "",
            contact_phone: visit?.contact_phone || "",
        },
    });

    const onSubmit: SubmitHandler<VisitScheduleFields> = async (data) => {
        try {
            const basePayload: Record<string, any> = {
                contact_name: data.contact_name,
                contact_phone: data.contact_phone,
            };

            if (isUpdate && visit && visit.id) {
                const payload: Record<string, any> = { ...basePayload };
                if (data.date) {
                    payload.date = new Date(data.date).toISOString();
                }

                await updateVisit({ id: visit.id, data: payload }).unwrap();

                toast.success("Agenda atualizada com sucesso.");
                (onSuccess ?? onCancel)();
            } else {
                if (!unitId) {
                    toast.error("Unidade inválida para criar visita.");
                    return;
                }
                if (!data.date) {
                    toast.error("Data da visita é obrigatória.");
                    return;
                }

                await createVisit({
                    unit: unitId,
                    date: new Date(data.date).toISOString(),
                    contact_name: data.contact_name,
                    contact_phone: data.contact_phone,
                }).unwrap();

                toast.success("Visita agendada com sucesso.");
                (onSuccess ?? onCancel)();
            }
        } catch (err) {
            toast.error(
                isUpdate
                    ? "Não foi possível atualizar a agenda. Verifique os dados e tente novamente."
                    : "Não foi possível agendar a visita. Verifique os dados e tente novamente."
            );
        }
    };

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Typography element="h3" size="title3" className="font-semibold">
                    {title ?? (isUpdate ? "Atualizar agenda" : "Agendar visita")}
                </Typography>

                <Input
                    {...register("date")}
                    type="datetime-local"
                    errorMessage={errors.date?.message}
                    dataTestId="visit-date-input"
                >
                    Data/Hora
                </Input>

                <Input
                    {...register("contact_name")}
                    type="text"
                    errorMessage={errors.contact_name?.message}
                    placeholder="Nome do contato"
                    dataTestId="visit-contact-name-input"
                >
                    Nome do contato
                </Input>

                <Input
                    {...register("contact_phone")}
                    type="text"
                    errorMessage={errors.contact_phone?.message}
                    placeholder="DD9XXXXXXXX"
                    dataTestId="visit-contact-phone-input"
                >
                    Telefone do contato
                </Input>

                <FormButtons isSubmitting={isSubmitting} needReview={false} onCancel={onCancel} />
            </Form>
        </div>
    );
};

export default VisitScheduleForm;
