"use client";

import { equipmentSchema } from "@/schemas";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

import { useAppDispatch } from "@/redux/hooks";
import { closeModal } from "@/redux/features/modalSlice";

import { Button } from "@/components/common";
import { Form, Textarea } from "@/components/forms";
import { Typography } from "@/components/foundation";

import { useEffect, useState } from "react";
import { useEditEquipmentMutation } from "@/redux/features/equipmentApiSlice";
import { OperationStatus } from "@/enums";
import { isErrorWithMessages } from "@/redux/services/helpers";
import { toast } from "react-toastify";

const noteSchema = equipmentSchema.pick({ note: true });

type ReviewDeleteEquipmentField = z.infer<typeof noteSchema>;

type ReviewDeleteEquipmentFormProps = {
    title: string;
    equipmentOperationID: number;
};

const ReviewDeleteEquipmentForm = ({
    title,
    equipmentOperationID,
}: ReviewDeleteEquipmentFormProps) => {
    const dispatch = useAppDispatch();

    const [isRejected, setIsRejected] = useState(false);

    const [updateEquipmentOperation] = useEditEquipmentMutation();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ReviewDeleteEquipmentField>({
        resolver: zodResolver(noteSchema),
    });

    const onSubmit: SubmitHandler<ReviewDeleteEquipmentField> = async ({ note }) => {
        try {
            // Create a FormData object to match the expected input for editEquipment mutation
            const equipmentData = new FormData();
            if (note) {
                equipmentData.append("note", note);
            }
            equipmentData.append(
                "operation_status",
                isRejected ? OperationStatus.REJECTED : OperationStatus.ACCEPTED
            );

            const response = await updateEquipmentOperation({
                equipmentID: equipmentOperationID,
                equipmentData,
            });

            if (response.error) {
                if (isErrorWithMessages(response.error)) {
                    throw new Error(response.error.data.messages[0]);
                }
                throw new Error("Um erro inesperado ocorreu.");
            }

            const successMessage = isRejected
                ? "Requisição rejeitada! O cliente será notificado de sua decisão."
                : "Equipamento removido com sucesso!";
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
    }, [isRejected, setValue]);

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
                                data-testid="btn-review-reject-delete-equipment"
                            >
                                Rejeitar
                            </Button>

                            <Button
                                type="submit"
                                variant="danger"
                                disabled={isSubmitting}
                                className="w-full mt-6"
                                data-testid="btn-review-accept-delete-equipment"
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
                        ></Textarea>

                        <div className="flex flex-row gap-2">
                            <Button
                                type="button"
                                onClick={() => setIsRejected(false)}
                                disabled={isSubmitting}
                                className="w-full mt-6"
                                data-testid="btn-review-reject-delete-equipment"
                            >
                                Voltar
                            </Button>

                            <Button
                                type="submit"
                                variant="danger"
                                disabled={isSubmitting}
                                className="w-full mt-6"
                                data-testid="btn-review-accept-delete-equipment"
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

export default ReviewDeleteEquipmentForm;
