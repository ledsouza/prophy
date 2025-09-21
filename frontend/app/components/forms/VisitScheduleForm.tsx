"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import type { VisitDTO } from "@/redux/features/visitApiSlice";
import { useUpdateVisitMutation } from "@/redux/features/visitApiSlice";

import { visitScheduleSchema } from "@/schemas";

import { Form, FormButtons, Input } from "@/components/forms";
import { Typography } from "@/components/foundation";

type VisitScheduleFields = z.infer<typeof visitScheduleSchema>;

type VisitScheduleFormProps = {
    visit: VisitDTO;
    onCancel: () => void;
    onSuccess?: (updated: Partial<VisitDTO>) => void;
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

const VisitScheduleForm = ({ visit, onCancel, onSuccess }: VisitScheduleFormProps) => {
    const [updateVisit] = useUpdateVisitMutation();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<VisitScheduleFields>({
        resolver: zodResolver(visitScheduleSchema),
        defaultValues: {
            date: toLocalDatetimeInputValue(visit.date),
            contact_name: visit.contact_name || "",
            contact_phone: visit.contact_phone || "",
        },
    });

    const onSubmit: SubmitHandler<VisitScheduleFields> = async (data) => {
        try {
            const payload: Record<string, any> = {
                contact_name: data.contact_name,
                contact_phone: data.contact_phone,
            };

            if (data.date) {
                payload.date = new Date(data.date).toISOString();
            }

            const updated = await updateVisit({ id: visit.id, data: payload }).unwrap();

            toast.success("Agenda atualizada com sucesso.");
            onSuccess?.({
                contact_name: updated.contact_name,
                contact_phone: updated.contact_phone,
                date: updated.date,
            });
            onCancel();
        } catch (err) {
            toast.error(
                "Não foi possível atualizar a agenda. Verifique os dados e tente novamente."
            );
        }
    };

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Typography element="h3" size="title3" className="font-semibold">
                    Atualizar agenda
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
