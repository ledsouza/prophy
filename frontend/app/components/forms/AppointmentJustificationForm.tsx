"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { Form, FormButtons, Textarea } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { useUpdateAppointmentMutation } from "@/redux/features/appointmentApiSlice";
import { makeAppointmentScheduleSchema } from "@/schemas";
import { child } from "@/utils/logger";

const justificationSchema = makeAppointmentScheduleSchema({ requireJustification: true }).pick({
    justification: true,
});

type AppointmentJustificationFields = z.infer<typeof justificationSchema>;

type AppointmentJustificationFormProps = {
    appointmentId: number;
    initialJustification?: string | null;
    onCancel: () => void;
    onSuccess: () => void;
    title?: string;
};

const AppointmentJustificationForm = ({
    appointmentId,
    initialJustification,
    onCancel,
    onSuccess,
    title,
}: AppointmentJustificationFormProps) => {
    const [updateAppointment] = useUpdateAppointmentMutation();
    const log = child({ component: "AppointmentJustificationForm" });

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<AppointmentJustificationFields>({
        resolver: zodResolver(justificationSchema),
        defaultValues: {
            justification: initialJustification ?? "",
        },
    });

    const onSubmit: SubmitHandler<AppointmentJustificationFields> = async (data) => {
        try {
            await updateAppointment({
                id: appointmentId,
                data: { justification: data.justification },
            }).unwrap();
            toast.success("Justificativa enviada com sucesso.");
            onSuccess();
        } catch (err) {
            log.error(
                {
                    appointmentId,
                    error:
                        err instanceof Error
                            ? err.message
                            : typeof err === "string"
                              ? err
                              : undefined,
                },
                "Submit justification failed"
            );
            toast.error("Não foi possível enviar a justificativa. Tente novamente.");
        }
    };

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Typography element="h3" size="title3" className="font-semibold">
                    {title ?? "Justificar agendamento não realizado"}
                </Typography>

                <Textarea
                    {...register("justification")}
                    errorMessage={errors.justification?.message}
                    placeholder="Descreva o motivo"
                    data-testid="appointment-justify-input"
                    rows={4}
                >
                    Justificativa
                </Textarea>

                <FormButtons
                    isSubmitting={isSubmitting}
                    needReview={false}
                    onCancel={onCancel}
                    submitLabel="Salvar"
                />
            </Form>
        </div>
    );
};

export default AppointmentJustificationForm;
