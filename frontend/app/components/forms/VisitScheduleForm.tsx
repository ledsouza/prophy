"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import type { VisitDTO, CreateVisitPayload, UpdateVisitPayload } from "@/types/visit";
import { useCreateVisitMutation, useUpdateVisitMutation } from "@/redux/features/visitApiSlice";

import { visitScheduleSchema } from "@/schemas";

import { Form, FormButtons, Input } from "@/components/forms";
import { Typography } from "@/components/foundation";
import VisitStatus from "@/enums/VisitStatus";
import { child } from "@/utils/logger";

type VisitScheduleFields = z.infer<typeof visitScheduleSchema>;

type VisitScheduleFormProps = {
    visit?: VisitDTO;
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
 * - onCancel: () => void — called when the user cancels the form.
 * - onSuccess: () => void — called after successful submit; parent should typically close the modal here and perform any post-success actions.
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
    const log = child({ component: "VisitScheduleForm" });

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
        log.info(
            { mode: isUpdate ? "update" : "create", unitId, visitId: visit?.id },
            "Submitting visit schedule"
        );
        try {
            const basePayload: Pick<CreateVisitPayload, "contact_name" | "contact_phone"> = {
                contact_name: data.contact_name,
                contact_phone: data.contact_phone,
            };

            if (isUpdate && visit && visit.id) {
                const payload: UpdateVisitPayload = { ...basePayload };
                if (data.date) {
                    payload.date = new Date(data.date).toISOString();
                    payload.status = VisitStatus.RESCHEDULED;
                }

                await updateVisit({ id: visit.id, data: payload }).unwrap();
                log.info(
                    { visitId: visit.id, status: payload.status, date: payload.date },
                    "Visit schedule updated"
                );

                toast.success("Agenda atualizada com sucesso.");
                onSuccess();
            } else {
                if (!unitId) {
                    log.warn({ unitId }, "VisitScheduleForm missing unitId in create mode");
                    toast.error("Unidade inválida para criar visita.");
                    return;
                }
                if (!data.date) {
                    log.warn({}, "VisitScheduleForm missing date in create mode");
                    toast.error("Data da visita é obrigatória.");
                    return;
                }

                const createPayload: CreateVisitPayload = {
                    unit: unitId,
                    date: new Date(data.date).toISOString(),
                    contact_name: data.contact_name,
                    contact_phone: data.contact_phone,
                };
                await createVisit(createPayload).unwrap();
                log.info({ unitId, date: createPayload.date }, "Visit scheduled successfully");

                toast.success("Visita agendada com sucesso.");
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
                    visitId: visit?.id,
                    unitId,
                },
                "Visit schedule submit failed"
            );
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
