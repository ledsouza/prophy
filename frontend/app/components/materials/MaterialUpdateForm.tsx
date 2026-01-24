"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { Button } from "@/components/common";
import { Form, Input, Textarea } from "@/components/forms";
import { Typography } from "@/components/foundation";

import { useUpdateMaterialMutation } from "@/redux/features/materialApiSlice";
import { handleApiError } from "@/redux/services/errorHandling";
import { materialUpdateSchema } from "@/schemas/";
import type { MaterialDTO } from "@/types/material";
import { hasChanges } from "@/utils/validation";

type MaterialUpdateFormProps = {
    initial: MaterialDTO;
    onSuccess?: () => void;
    onCancel?: () => void;
    submitTestId?: string;
};

const updateSchema = materialUpdateSchema;

type UpdateFields = z.infer<typeof updateSchema>;

type UpdateFormFields = z.input<typeof updateSchema>;

type UpdateSubmitFields = z.output<typeof updateSchema>;

const MaterialUpdateForm = ({
    initial,
    onSuccess,
    onCancel,
    submitTestId = "btn-material-update-submit",
}: MaterialUpdateFormProps) => {
    const [updateMaterial, { isLoading: isUpdating }] = useUpdateMaterialMutation();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<UpdateFormFields>({
        resolver: zodResolver(updateSchema, undefined, { raw: true }),
        defaultValues: {
            title: initial.title,
            description: initial.description || "",
        },
    });

    const onSubmit: SubmitHandler<UpdateFormFields> = async (data) => {
        const parsed = updateSchema.parse(data) as UpdateSubmitFields;
        const firstFile = parsed.file?.[0];

        const initialContent = {
            title: initial.title,
            description: initial.description,
        };
        const currentContent = {
            title: data.title,
            description: data.description,
            file: firstFile,
        };

        if (!hasChanges(initialContent, currentContent, ["file"])) {
            toast.info("Nenhuma alteração a salvar.");
            return;
        }

        try {
            const payload = {
                id: initial.id,
                title: parsed.title,
                description: parsed.description,
                ...(firstFile ? { file: firstFile } : {}),
            };

            await updateMaterial(payload).unwrap();
            toast.success("Material atualizado com sucesso.");
            onSuccess?.();
        } catch (err: any) {
            handleApiError(err, "Error updating material");
        }
    };

    const hasSelectedFile = ((watch("file") as FileList | undefined)?.length ?? 0) > 0;

    return (
        <div className="w-full">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Typography element="h3" size="title3" className="font-semibold">
                    Editar material
                </Typography>

                <Typography variant="secondary" className="mt-1">
                    Você pode escolher o campo que deseja atualizar e manter os outros como estão se
                    não quiser alterar nada.
                </Typography>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                        <Input
                            {...register("title")}
                            type="text"
                            errorMessage={errors.title?.message}
                            data-testid="material-update-title-input"
                            label="Título"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <Textarea
                            {...register("description")}
                            errorMessage={errors.description?.message}
                            data-testid="material-update-description-input"
                            label="Descrição"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <Input
                            {...register("file")}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            errorMessage={errors.file?.message as string | undefined}
                            data-testid="material-update-file-input"
                            label="Substituir arquivo (opcional)"
                        />
                    </div>
                </div>

                <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        disabled={isSubmitting || isUpdating}
                        className="w-full sm:w-auto"
                        data-testid="material-update-cancel-btn"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || isUpdating || (!isDirty && !hasSelectedFile)}
                        className="w-full sm:w-auto"
                        data-testid={submitTestId}
                    >
                        {isSubmitting || isUpdating ? "Enviando..." : "Atualizar"}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default MaterialUpdateForm;
