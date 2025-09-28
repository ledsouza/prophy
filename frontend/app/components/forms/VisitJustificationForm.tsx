"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { Form, FormButtons, Textarea } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { useUpdateVisitMutation } from "@/redux/features/visitApiSlice";
import { makeVisitScheduleSchema } from "@/schemas";
import { child } from "@/utils/logger";

const justificationSchema = makeVisitScheduleSchema({ requireJustification: true }).pick({
    justification: true,
});

type VisitJustificationFields = z.infer<typeof justificationSchema>;

type VisitJustificationFormProps = {
    visitId: number;
    initialJustification?: string | null;
    onCancel: () => void;
    onSuccess: () => void;
    title?: string;
};

const VisitJustificationForm = ({
    visitId,
    initialJustification,
    onCancel,
    onSuccess,
    title,
}: VisitJustificationFormProps) => {
    const [updateVisit] = useUpdateVisitMutation();
    const log = child({ component: "VisitJustificationForm" });

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<VisitJustificationFields>({
        resolver: zodResolver(justificationSchema),
        defaultValues: {
            justification: initialJustification ?? "",
        },
    });

    const onSubmit: SubmitHandler<VisitJustificationFields> = async (data) => {
        try {
            await updateVisit({
                id: visitId,
                data: { justification: data.justification },
            }).unwrap();
            toast.success("Justificativa enviada com sucesso.");
            onSuccess();
        } catch (err) {
            log.error(
                {
                    visitId,
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
                    {title ?? "Justificar visita não realizada"}
                </Typography>

                <Textarea
                    {...register("justification")}
                    errorMessage={errors.justification?.message}
                    placeholder="Descreva o motivo"
                    data-testid="visit-justify-input"
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

export default VisitJustificationForm;
