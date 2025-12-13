"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "react-toastify";

import { Button } from "@/components/common";
import { Form, Input, Select, Textarea } from "@/components/forms";
import { Typography } from "@/components/foundation";

import Role from "@/enums/Role";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import { useCreateMaterialMutation } from "@/redux/features/materialApiSlice";
import {
    VISIBILITY_OPTIONS,
    PUBLIC_CATEGORY_OPTIONS,
    INTERNAL_CATEGORY_OPTIONS,
} from "@/constants/materials";
import type { MaterialVisibility, MaterialCategoryCode } from "@/types/material";
import { reportFileSchema } from "@/schemas";

type MaterialFormProps = {
    onSuccess?: () => void;
    onCancel?: () => void;
    submitTestId?: string;
};

const materialFormSchema = z.object({
    title: z
        .string()
        .min(1, { message: "Título é obrigatório." })
        .max(150, { message: "Título deve ter no máximo 150 caracteres." }),
    description: z.string().optional(),
    // We will enforce allowed values through UI; schema requires concrete choices
    visibility: z.enum(["PUB", "INT"]),
    category: z.string().min(1, {
        message: "Categoria é obrigatória.",
    }) as unknown as z.ZodType<MaterialCategoryCode>,
    file: reportFileSchema,
});

type MaterialFormFields = z.infer<typeof materialFormSchema>;

const MaterialForm = ({
    onSuccess,
    onCancel,
    submitTestId = "btn-material-create-submit",
}: MaterialFormProps) => {
    const { data: user } = useRetrieveUserQuery();
    const role = user?.role;

    const isProphyManager = role === Role.GP;
    const isInternalMP = role === Role.FMI;
    const canUpload = isProphyManager || isInternalMP;

    // For non-GP we will force PUB; GP must explicitly choose a visibility
    const defaultPubVisibility = React.useMemo(
        () =>
            (
                VISIBILITY_OPTIONS as Array<{
                    id: number;
                    value: string;
                    code?: MaterialVisibility;
                }>
            ).find((v) => v.code === "PUB"),
        []
    );
    const [createMaterial, { isLoading: isCreating }] = useCreateMaterialMutation();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        watch,
    } = useForm<MaterialFormFields>({
        resolver: zodResolver(materialFormSchema),
        defaultValues: {
            title: "",
            description: "",
            // GP must explicitly pick visibility; non-GP forced to PUB
            visibility: (isProphyManager
                ? (undefined as any)
                : ("PUB" as MaterialFormFields["visibility"])) as MaterialFormFields["visibility"],
            category: "" as MaterialCategoryCode,
        },
    });

    // Local select states compatible with existing Select component
    const [selectedVisibility, setSelectedVisibility] = React.useState<{
        id: number;
        value: string;
        code?: MaterialVisibility;
    } | null>(isProphyManager ? null : (defaultPubVisibility as any));

    const visibilityOptions = React.useMemo(() => {
        // Filter out any placeholder like "Todos"; allow only PUB/INT
        const onlyReal = (
            VISIBILITY_OPTIONS as Array<{ id: number; value: string; code?: MaterialVisibility }>
        ).filter((v) => v.code === "PUB" || v.code === "INT");
        return isProphyManager ? onlyReal : onlyReal.filter((v) => v.code === "PUB");
    }, [isProphyManager]);

    const categoryOptions = React.useMemo(() => {
        const code = selectedVisibility?.code;
        if (!code) return [];
        if (code === "PUB") {
            return PUBLIC_CATEGORY_OPTIONS;
        }
        return INTERNAL_CATEGORY_OPTIONS;
    }, [selectedVisibility]);

    const [selectedCategory, setSelectedCategory] = React.useState<{
        id: number;
        value: string;
        code?: MaterialCategoryCode;
    } | null>(null);

    // Keep RHF values in sync with selects
    React.useEffect(() => {
        if (isProphyManager) {
            const code = selectedVisibility?.code;
            if (code) {
                setValue("visibility", code as MaterialVisibility, { shouldValidate: true });
            }
        } else {
            setValue("visibility", "PUB" as MaterialVisibility, { shouldValidate: true });
        }
    }, [selectedVisibility, setValue, isProphyManager]);

    React.useEffect(() => {
        const catCode = selectedCategory?.code ?? ("" as MaterialCategoryCode);
        setValue("category", catCode, { shouldValidate: true });
    }, [selectedCategory, setValue]);

    if (!canUpload) {
        return null;
    }

    const onSubmit: SubmitHandler<MaterialFormFields> = async (data) => {
        try {
            const file = data.file[0];

            // Force non-GP to only PUB
            const visibility = isProphyManager ? data.visibility : ("PUB" as MaterialVisibility);

            await createMaterial({
                title: data.title,
                description: data.description || undefined,
                visibility,
                category: data.category as MaterialCategoryCode,
                file,
            }).unwrap();

            toast.success("Material criado com sucesso.");
            onSuccess?.();
        } catch (err: any) {
            const message =
                err?.data?.detail ||
                err?.data?.message ||
                "Não foi possível criar o material. Verifique os dados e tente novamente.";
            toast.error(message);
        }
    };

    return (
        <div className="w-full">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Typography element="h3" size="title3" className="font-semibold">
                    Adicionar material
                </Typography>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                        <Input
                            {...register("title")}
                            type="text"
                            errorMessage={errors.title?.message}
                            data-testid="material-title-input"
                            label="Título"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <Textarea
                            {...register("description")}
                            errorMessage={errors.description?.message}
                            data-testid="material-description-input"
                            label="Descrição"
                        />
                    </div>

                    <Select
                        options={visibilityOptions}
                        selectedData={selectedVisibility}
                        setSelect={(v) => setSelectedVisibility(v)}
                        label="Visibilidade"
                        dataTestId="material-visibility-select"
                        disabled={!isProphyManager}
                        listBoxButtonSize="sm"
                        listOptionSize="sm"
                        placeholder="Selecione..."
                    />

                    <Select
                        options={categoryOptions as any}
                        selectedData={selectedCategory as any}
                        setSelect={(v) => setSelectedCategory(v as any)}
                        label="Categoria"
                        dataTestId="material-category-select"
                        listBoxButtonSize="sm"
                        listOptionSize="sm"
                        placeholder={
                            selectedVisibility?.code
                                ? "Selecione a categoria..."
                                : "Selecione a visibilidade..."
                        }
                        disabled={isProphyManager ? !selectedVisibility?.code : false}
                    />

                    <div className="md:col-span-2">
                        <Input
                            {...register("file")}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            errorMessage={errors.file?.message}
                            data-testid="material-file-input"
                            label="Arquivo"
                        />
                    </div>
                </div>

                <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        disabled={isSubmitting || isCreating}
                        className="w-full sm:w-auto"
                        data-testid="material-cancel-btn"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || isCreating}
                        className="w-full sm:w-auto"
                        data-testid={submitTestId}
                    >
                        {isSubmitting || isCreating ? "Enviando..." : "Salvar"}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default MaterialForm;
