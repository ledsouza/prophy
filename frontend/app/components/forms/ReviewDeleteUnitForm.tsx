"use client";

import { unitSchema } from "@/schemas";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

import { useAppDispatch } from "@/redux/hooks";
import { closeModal } from "@/redux/features/modalSlice";

import { Button } from "@/components/common";
import { Form, Textarea } from "@/components/forms";
import { Typography } from "@/components/foundation";

import { useEffect, useState } from "react";
import { useUpdateUnitMutation } from "@/redux/features/unitApiSlice";
import { OperationStatus } from "@/enums";
import { isErrorWithMessages } from "@/redux/services/helpers";
import { toast } from "react-toastify";

const noteSchema = unitSchema.pick({ note: true });

type ReviewDeleteUnitField = z.infer<typeof noteSchema>;

type ReviewDeleteUnitFormProps = {
    title: string;
    unitOperationID: number;
};

const ReviewDeleteUnitForm = ({ title, unitOperationID }: ReviewDeleteUnitFormProps) => {
    const dispatch = useAppDispatch();

    const [isRejected, setIsRejected] = useState(false);

    const [updateUnitOperation] = useUpdateUnitMutation();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ReviewDeleteUnitField>({
        resolver: zodResolver(noteSchema),
    });

    const onSubmit: SubmitHandler<ReviewDeleteUnitField> = async ({ note }) => {
        try {
            const response = await updateUnitOperation({
                unitID: unitOperationID,
                unitData: {
                    note: note,
                    operation_status: isRejected
                        ? OperationStatus.REJECTED
                        : OperationStatus.ACCEPTED,
                },
            });

            if (response.error) {
                if (isErrorWithMessages(response.error)) {
                    throw new Error(response.error.data.messages[0]);
                }
                throw new Error("Um erro inesperado ocorreu.");
            }

            const successMessage = isRejected
                ? "Requisição rejeitada! O cliente será notificado de sua decisão."
                : "Unidade removida com sucesso!";
            toast.success(successMessage);
            dispatch(closeModal());
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Algo deu errado. Tente novamente mais tarde."
            );
        }
    };

    // If the user clicks in go back, it's required to transform the note to undefined
    useEffect(() => {
        if (!isRejected) {
            setValue("note", undefined);
        }
    }, [isRejected]);

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            <Form onSubmit={handleSubmit(onSubmit)}>
                {!isRejected && (
                    <>
                        <Typography element="h2" size="title2" className="mb-6">
                            {title}
                        </Typography>

                        <div className="flex flex-row gap-2">
                            <Button
                                type="button"
                                onClick={() => setIsRejected(true)}
                                disabled={isSubmitting}
                                className="w-full mt-6"
                                data-testid="btn-review-reject-delete-unit"
                            >
                                Rejeitar
                            </Button>

                            <Button
                                type="submit"
                                variant="danger"
                                disabled={isSubmitting}
                                className="w-full mt-6"
                                data-testid="btn-review-accept-delete-unit"
                            >
                                Concordar
                            </Button>
                        </div>
                    </>
                )}

                {isRejected && (
                    <>
                        <Typography element="h2" size="title2" className="mb-6">
                            Por favor, justifique o motivo da rejeição
                        </Typography>

                        <Textarea
                            {...register("note")}
                            rows={18}
                            errorMessage={errors.note?.message}
                            placeholder="Justifique o motivo da rejeição"
                            data-testid="rejection-note-input"
                        />

                        <div className="flex flex-row gap-2">
                            <Button
                                type="button"
                                onClick={() => setIsRejected(false)}
                                disabled={isSubmitting}
                                className="w-full mt-6"
                                data-testid="btn-review-reject-delete-unit"
                            >
                                Voltar
                            </Button>

                            <Button
                                type="submit"
                                variant="danger"
                                disabled={isSubmitting}
                                className="w-full mt-6"
                                data-testid="btn-review-accept-delete-unit"
                            >
                                Enviar
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </div>
    );
};

export default ReviewDeleteUnitForm;
