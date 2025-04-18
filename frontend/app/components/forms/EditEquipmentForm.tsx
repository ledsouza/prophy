"use client";

import { useEffect, useState } from "react";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import AccessoryCreationError from "@/errors/accessory-error";
import { accessorySchema, equipmentSchema, optionalFileSchema } from "@/schemas";

import {
    EquipmentDTO,
    EquipmentOperationDTO,
    useCreateEditEquipmentOperationMutation,
    useEditEquipmentMutation,
} from "@/redux/features/equipmentApiSlice";
import {
    AccessoryDTO,
    useCreateAccessoryMutation,
    useGetAccessoriesQuery,
    useUpdateAccessoryMutation,
} from "@/redux/features/accessoryApiSlice";
import { AccessoryType } from "@/redux/features/modalityApiSlice";
import { closeModal } from "@/redux/features/modalSlice";
import { useAppDispatch } from "@/redux/hooks";

import { fetchPhoto } from "@/utils/media";
import { displaySingularAccessoryType } from "@/utils/format";
import { useModality } from "@/hooks/use-modality";
import useRequireAuth from "@/hooks/use-require-auth";
import { useNeedReview } from "@/hooks";

import { Button, Spinner } from "@/components/common";
import { Typography } from "@/components/foundation";
import { Form, Input, Select, FormButtons } from "@/components/forms";

const editAccessorySchema = accessorySchema
    .extend({
        id: z.number().optional(),
        equipment_photo: optionalFileSchema,
        label_photo: optionalFileSchema,
        original_equipment_photo: z.string().optional(),
        original_label_photo: z.string().optional(),
    })
    .superRefine((accessory, ctx) => {
        // If there’s no original photo and the user hasn’t uploaded a new one, add an error.
        const hasNewPhoto = accessory.equipment_photo && accessory.equipment_photo.length > 0;
        if (!accessory.original_equipment_photo && !hasNewPhoto) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "O arquivo é obrigatório para novos acessórios.",
                path: ["equipment_photo"],
            });
        }

        const hasNewLabelPhoto = accessory.label_photo && accessory.label_photo.length > 0;
        if (!accessory.original_label_photo && !hasNewLabelPhoto) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "O arquivo é obrigatório para novos acessórios.",
                path: ["label_photo"],
            });
        }
    });

const editEquipmentSchema = equipmentSchema.extend({
    equipment_photo: optionalFileSchema,
    label_photo: optionalFileSchema,
    accessories: z.array(editAccessorySchema),
});

export type EditEquipmentFields = z.infer<typeof editEquipmentSchema>;

type EditEquipmentFormProps = {
    title?: string;
    description?: string;
    disabled?: boolean;
    reviewMode?: boolean;
    equipment: EquipmentDTO;
};

const EditEquipmentForm = ({
    title,
    description,
    reviewMode,
    disabled,
    equipment,
}: EditEquipmentFormProps) => {
    const dispatch = useAppDispatch();

    const { userData } = useRequireAuth();

    const [equipmentPhotoFile, setEquipmentPhotoFile] = useState<File | null>(null);
    const [equipmentLabelPhotoFile, setEquipmentLabelPhotoFile] = useState<File | null>(null);

    const [filteredAccessories, setFilteredAccessories] = useState<AccessoryDTO[]>([]);

    const [editAccessories, setEditAccessories] = useState(false);

    const {
        data: accessories,
        isLoading: isLoadingAccessories,
        isError: isErrorAccessories,
    } = useGetAccessoriesQuery();

    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        control,
        formState: { errors, isSubmitting },
    } = useForm<EditEquipmentFields>({
        resolver: zodResolver(editEquipmentSchema),
        defaultValues: {
            manufacturer: equipment.manufacturer,
            model: equipment.model,
            series_number: equipment.series_number,
            anvisa_registry: equipment.anvisa_registry,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "accessories",
    });

    const { needReview } = useNeedReview();
    const [isRejected, setIsRejected] = useState(false);

    const {
        modalityOptions,
        selectedModality,
        setSelectedModality,
        accessoryType,
        isErrorModalities,
        isLoadingModalities,
    } = useModality(setValue, equipment.modality);

    const [createEditEquipmentOperation] = useCreateEditEquipmentOperationMutation();
    const [editEquipment] = useEditEquipmentMutation();
    const [createAccessory] = useCreateAccessoryMutation();
    const [updateAccessory] = useUpdateAccessoryMutation();

    const handleAccessoryPhoto = async (endpoint: string) => {
        const accessoryPhoto = await fetchPhoto(endpoint);
        return accessoryPhoto;
    };

    const handleEquipmentPhoto = async (endpoint: string) => {
        const equipmentPhoto = await fetchPhoto(endpoint);
        setEquipmentPhotoFile(equipmentPhoto);
    };

    const handleEquipmentLabelPhoto = async (endpoint: string) => {
        const equipmentPhoto = await fetchPhoto(endpoint);
        setEquipmentLabelPhotoFile(equipmentPhoto);
    };

    const handleAddAccessory = () => {
        setEditAccessories(true);
    };

    const isSameData = (equipmentFormData: FormData, accessoriesFormData: FormData[]) => {
        const sameEquipment = Array.from(equipmentFormData.entries()).every(([key, value]) => {
            if (typeof value === "string") {
                // No reason to compare data that the user doesn't change
                if (key === "original_equipment" || key === "operation_type") {
                    return true;
                    // modality is an object field
                } else if (key === "modality") {
                    return value === equipment.modality.id.toString();
                } else {
                    return (
                        value.toLowerCase() ===
                        equipment[key as keyof EquipmentDTO]?.toString().toLowerCase()
                    );
                }
            } else if (value instanceof File) {
                const originalFile = equipment[key as keyof EquipmentDTO] as string | undefined;
                return value.name === originalFile?.split("/").pop();
            }
        });

        // First check if the number of accessories has changed
        if (accessoriesFormData.length !== filteredAccessories.length) {
            return false; // Different number of accessories means data has changed
        }

        // Then check if any individual accessory has changed
        const sameAccessories = accessoriesFormData.every((accessoryFormData, index) => {
            const originalAccessory = filteredAccessories[index];

            // Check each field in the accessory form data
            return Array.from(accessoryFormData.entries()).every(([key, value]) => {
                if (typeof value === "string") {
                    // Compare string values
                    return (
                        value.toLowerCase() ===
                        originalAccessory[key as keyof typeof originalAccessory]
                            ?.toString()
                            .toLowerCase()
                    );
                } else if (value instanceof File) {
                    // Compare file names for photo fields
                    const originalFile = originalAccessory[
                        key as keyof typeof originalAccessory
                    ] as string | undefined;
                    return value.name === originalFile?.split("/").pop();
                }
                return true; // Default case for any other type
            });
        });

        // Return true only if both equipment and accessories are the same
        return sameEquipment && sameAccessories;
    };

    const createEquipmentForm = (data: EditEquipmentFields) => {
        const equipmentFormData = new FormData();

        // Handle text fields
        equipmentFormData.append("original_equipment", equipment.id.toString());
        equipmentFormData.append("unit", equipment.unit.toString());
        equipmentFormData.append("modality", data.modality.toString());
        equipmentFormData.append("manufacturer", data.manufacturer);
        equipmentFormData.append("model", data.model);
        equipmentFormData.append("series_number", data.series_number);
        equipmentFormData.append("anvisa_registry", data.anvisa_registry);

        // Handle file uploads - check if files exist before appending
        if (data.equipment_photo?.[0]) {
            equipmentFormData.append("equipment_photo", data.equipment_photo[0]);
        } else if (equipmentPhotoFile) {
            equipmentFormData.append("equipment_photo", equipmentPhotoFile);
        }

        if (data.label_photo?.[0]) {
            equipmentFormData.append("label_photo", data.label_photo[0]);
        } else if (equipmentLabelPhotoFile) {
            equipmentFormData.append("label_photo", equipmentLabelPhotoFile);
        }

        return equipmentFormData;
    };

    const createAccessoryForm = async () => {
        const accessoriesFields = getValues("accessories");

        const accessoriesFormDataPromises = accessoriesFields.map(async (accessory, index) => {
            const accessoryFormData = new FormData();
            accessoryFormData.append("model", accessory.model);
            accessoryFormData.append("series_number", accessory.series_number);

            if (accessory.equipment_photo?.[0]) {
                accessoryFormData.append("equipment_photo", accessory.equipment_photo[0]);
            } else if (filteredAccessories[index]?.equipment_photo) {
                const equipmentPhotoFile = await handleAccessoryPhoto(
                    filteredAccessories[index].equipment_photo
                );
                accessoryFormData.append("equipment_photo", equipmentPhotoFile);
            }

            if (accessory.label_photo?.[0]) {
                accessoryFormData.append("label_photo", accessory.label_photo[0]);
            } else if (filteredAccessories[index]?.label_photo) {
                const equipmentLabelPhotoFile = await handleAccessoryPhoto(
                    filteredAccessories[index].label_photo
                );
                accessoryFormData.append("label_photo", equipmentLabelPhotoFile);
            }

            return accessoryFormData;
        });

        const accessoriesFormData = await Promise.all(accessoriesFormDataPromises);
        return accessoriesFormData;
    };

    const handleAccessories = async (
        accessoriesForm: FormData[],
        equipment: EquipmentOperationDTO
    ) => {
        const accessoriesFields = getValues("accessories");

        const promises = accessoriesForm.map(async (formData, index) => {
            // Add common fields
            formData.append("manufacturer", equipment.manufacturer);
            formData.append("category", accessoryType ? accessoryType : AccessoryType.NONE);
            formData.append("equipment", equipment.id.toString());

            // Check if this is an existing accessory (has ID) or a new one
            const accessory = accessoriesFields[index];

            if (accessory.id) {
                // This is an existing accessory - update it
                try {
                    const response = await updateAccessory({
                        accessoryID: accessory.id,
                        accessoryData: formData,
                    });

                    if (response.error) {
                        return { success: false, error: JSON.stringify(response.error) };
                    }
                    return { success: true, data: response };
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : JSON.stringify(error),
                    };
                }
            } else {
                // This is a new accessory - create it
                try {
                    const response = await createAccessory(formData);
                    if (response.error) {
                        return { success: false, error: JSON.stringify(response.error) };
                    }
                    return { success: true, data: response };
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : JSON.stringify(error),
                    };
                }
            }
        });

        // Wait for all operations to complete
        const results = await Promise.all(promises);

        // Collect all errors from failed attempts
        const errors = results.filter((result) => !result.success).map((result) => result.error);

        // If there are any errors, throw a single error with all details
        if (errors.length > 0) {
            throw new AccessoryCreationError(`Errors processing accessories: ${errors.join(", ")}`);
        }

        return results;
    };

    const renderEquipmentInputs = () => {
        return (
            <>
                {userData?.role !== "GGC" &&
                    (modalityOptions && selectedModality ? (
                        <Select
                            options={modalityOptions}
                            selectedData={selectedModality}
                            setSelect={setSelectedModality}
                            label="Modalidade"
                            labelSize="sm"
                            listBoxButtonSize="sm"
                            listOptionSize="sm"
                            dataTestId="equipment-modality-select"
                        />
                    ) : (
                        <div className="flex flex-col items-center">
                            <Spinner md />
                            <Typography element="p" size="md" className="text-center">
                                Carregando opções de modalidade...
                            </Typography>
                        </div>
                    ))}

                <Input
                    {...register("manufacturer")}
                    type="text"
                    errorMessage={errors.manufacturer?.message}
                    placeholder="Digite o nome do fabricante"
                    data-testid="equipment-manufacturer-input"
                >
                    Fabricante
                </Input>

                <Input
                    {...register("model")}
                    type="text"
                    errorMessage={errors.model?.message}
                    placeholder="Digite o nome do modelo"
                    data-testid="equipment-model-input"
                >
                    Modelo
                </Input>

                <Input
                    {...register("series_number")}
                    type="text"
                    errorMessage={errors.series_number?.message}
                    placeholder="Digite o número de série, se houver"
                    data-testid="equipment-series-number-input"
                >
                    Número de série
                </Input>

                <Input
                    {...register("anvisa_registry")}
                    type="text"
                    errorMessage={errors.anvisa_registry?.message}
                    placeholder="Digite o registro na ANVISA, se houver"
                    data-testid="equipment-anvisa-registry-input"
                >
                    Registro na ANVISA
                </Input>

                <Input
                    {...register("equipment_photo")}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    errorMessage={errors.equipment_photo?.message}
                    data-testid="equipment-photo-input"
                >
                    Foto do equipamento
                </Input>

                {equipment.equipment_photo && (
                    <Typography element="p" size="sm">
                        Nome do arquivo atual: {equipment.equipment_photo.split("/").pop()}
                    </Typography>
                )}

                <Input
                    {...register("label_photo")}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    errorMessage={errors.label_photo?.message}
                    data-testid="equipment-label-input"
                >
                    Foto do rótulo do equipamento
                </Input>

                {equipment.label_photo && (
                    <Typography element="p" size="sm">
                        Nome do arquivo atual: {equipment.label_photo.split("/").pop()}
                    </Typography>
                )}
            </>
        );
    };

    const renderAccessoryInputs = (accessoryIndex: number, remove: (index: number) => void) => {
        return (
            <div key={accessoryIndex} className="flex flex-col gap-4">
                <div className="flex justify-between gap-24 items-center">
                    <Typography element="h3" className="font-semibold">
                        {displaySingularAccessoryType(accessoryType!)}&nbsp;{accessoryIndex + 1}
                    </Typography>

                    <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => remove(accessoryIndex)}
                        variant="secondary"
                        data-testid="cancel-btn"
                        className="w-full"
                    >
                        Remover este acessório
                    </Button>
                </div>

                <Input
                    {...register(`accessories.${accessoryIndex}.model`)}
                    type="text"
                    errorMessage={errors.accessories?.[accessoryIndex]?.model?.message}
                    placeholder="Digite o nome do modelo"
                    data-testid="equipment-model-input"
                >
                    Modelo
                </Input>

                <Input
                    {...register(`accessories.${accessoryIndex}.series_number`)}
                    type="text"
                    errorMessage={errors.accessories?.[accessoryIndex]?.series_number?.message}
                    placeholder="Digite o número de série, se houver"
                    data-testid="equipment-series-number-input"
                >
                    Número de série
                </Input>

                <Input
                    {...register(`accessories.${accessoryIndex}.equipment_photo`)}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    errorMessage={errors.accessories?.[accessoryIndex]?.equipment_photo?.message}
                    data-testid="equipment-photo-input"
                >
                    Foto do equipamento
                </Input>

                {filteredAccessories[accessoryIndex]?.equipment_photo && (
                    <Typography element="p" size="sm">
                        Nome do arquivo atual:{" "}
                        {filteredAccessories[accessoryIndex].equipment_photo.split("/").pop()}
                    </Typography>
                )}

                <Input
                    {...register(`accessories.${accessoryIndex}.label_photo`)}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    errorMessage={errors.accessories?.[accessoryIndex]?.label_photo?.message}
                    data-testid="equipment-label-input"
                >
                    Foto do rótulo do equipamento
                </Input>

                {filteredAccessories[accessoryIndex]?.label_photo && (
                    <Typography element="p" size="sm">
                        Nome do arquivo atual:{" "}
                        {filteredAccessories[accessoryIndex].label_photo.split("/").pop()}
                    </Typography>
                )}
            </div>
        );
    };

    const renderButtons = () => {
        // If there are no accessories and the user is not editing them
        if (accessoryType === AccessoryType.NONE && !editAccessories) {
            return (
                <FormButtons
                    isRejected={isRejected}
                    setIsRejected={setIsRejected}
                    disabled={disabled}
                    reviewMode={reviewMode}
                    isSubmitting={isSubmitting}
                    needReview={needReview}
                />
            );
        }

        // If there are accessories and the user is not editing them
        if (accessoryType !== AccessoryType.NONE && !editAccessories) {
            return (
                <div>
                    <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleAddAccessory}
                        variant="secondary"
                        data-testid="submit-btn"
                        className="w-full"
                    >
                        Acessórios
                    </Button>
                    <FormButtons
                        isRejected={isRejected}
                        setIsRejected={setIsRejected}
                        disabled={disabled}
                        reviewMode={reviewMode}
                        isSubmitting={isSubmitting}
                        needReview={needReview}
                    />
                </div>
            );
        }

        // If the user is editing accessories
        return (
            <div className="flex gap-2 py-4">
                <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() =>
                        append({
                            model: "",
                            series_number: "",
                            equipment_photo: new DataTransfer().files,
                            label_photo: new DataTransfer().files,
                        })
                    }
                    variant="secondary"
                    data-testid="submit-btn"
                    className="w-full"
                >
                    Adicionar um {displaySingularAccessoryType(accessoryType!)}
                </Button>
                <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setEditAccessories(false)}
                    variant="primary"
                    data-testid="cancel-btn"
                    className="w-full"
                >
                    Concluir
                </Button>
            </div>
        );
    };

    const onSubmit: SubmitHandler<EditEquipmentFields> = async (data) => {
        if (isLoadingModalities) {
            toast.warning("Aguarde o carregamento das modalidades.");
            return;
        }

        const equipmentFormData = createEquipmentForm(data);
        const accessoriesFormData = await createAccessoryForm();

        if (!reviewMode && isSameData(equipmentFormData, accessoriesFormData)) {
            toast.warning("Nenhuma alteração foi detectada nos dados.");
            return;
        }

        try {
            const equipmentResponse = needReview
                ? await createEditEquipmentOperation(equipmentFormData)
                : await editEquipment({
                      equipmentID: equipment.id,
                      equipmentData: equipmentFormData,
                  });

            if (equipmentResponse.error) {
                throw new Error(`Error creating equipment: ${equipmentResponse.error}`);
            }

            await handleAccessories(accessoriesFormData, equipmentResponse.data);

            // If review is not required, the user is either an internal medical physicist or a Prophy manager.
            // The user may be editing data or reviewing an operation.
            // If `isRejected` is false, the user accepted the operation or updated some data.
            let successMessage;
            if (!needReview) {
                successMessage = isRejected
                    ? "Revisão concluída! O cliente será notificado da rejeição."
                    : "Dados atualizados com sucesso!";
            }
            toast.success(successMessage);
            dispatch(closeModal());
        } catch (error) {
            if (error instanceof AccessoryCreationError) {
                console.error("Accessory creation error:", error.message);
                toast.error("Erro ao criar acessório. Verifique os dados e tente novamente.");
            } else if (error instanceof Error) {
                console.error("Failed to create equipment:", error.message);
                toast.error("Algo deu errado. Tente novamente mais tarde.");
            } else {
                console.error("Failed to create equipment:", error);
                toast.error("Algo deu errado. Tente novamente mais tarde.");
            }
        }
    };

    // Convert accessories to form data type
    useEffect(() => {
        if (!filteredAccessories || isLoadingAccessories) {
            return;
        }

        setValue(
            "accessories",
            filteredAccessories.map((accessory) => ({
                id: accessory.id,
                model: accessory.model,
                series_number: accessory.series_number,
                equipment_photo: null,
                label_photo: null,
                original_equipment_photo: accessory.equipment_photo || undefined,
                original_label_photo: accessory.label_photo || undefined,
            }))
        );
    }, [filteredAccessories]);

    // Filter accessories by equipment ID
    useEffect(() => {
        if (!accessories || isLoadingAccessories) {
            return;
        }
        setFilteredAccessories(
            accessories.filter((accessory) => accessory.equipment === equipment.id)
        );
    }, [accessories]);

    // Fetch accessories photos from the server
    useEffect(() => {
        if (equipment.equipment_photo) {
            try {
                handleEquipmentPhoto(equipment.equipment_photo);
            } catch (error) {
                toast.error("Erro ao carregar a foto do equipamento.");
            }
        }

        if (equipment.label_photo) {
            try {
                handleEquipmentPhoto(equipment.label_photo);
            } catch (error) {
                toast.error("Erro ao carregar a foto do rótulo do equipamento.");
            }
        }
    }, [equipment]);

    // Fetch equipment photos from the server
    useEffect(() => {
        if (equipment.equipment_photo) {
            try {
                handleEquipmentPhoto(equipment.equipment_photo);
            } catch (error) {
                toast.error("Erro ao carregar a foto do equipamento.");
            }
        }

        if (equipment.label_photo) {
            try {
                handleEquipmentLabelPhoto(equipment.label_photo);
            } catch (error) {
                toast.error("Erro ao carregar a foto do rótulo do equipamento.");
            }
        }
    }, [equipment]);

    if (isErrorModalities || isErrorAccessories) {
        toast.error("Algo deu errado. Tente novamente mais tarde.");
        dispatch(closeModal());
        return null;
    }

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Typography element="h3" size="title3" className="font-semibold">
                    {title}
                </Typography>
                <Typography element="p" size="md" className="text-justify">
                    {description}
                </Typography>

                {!editAccessories && renderEquipmentInputs()}

                {editAccessories && fields.map((_, index) => renderAccessoryInputs(index, remove))}

                {editAccessories && fields.length === 0 && (
                    <Typography element="p" className="font-semibold">
                        Nenhum acessório adicionado. Clique em "Adicionar um{" "}
                        {displaySingularAccessoryType(accessoryType!)}" para adicionar um acessório.
                    </Typography>
                )}

                {fields.length > 0 && !editAccessories && (
                    <Typography element="p" className="font-semibold">
                        Acessórios adicionados:
                    </Typography>
                )}
                {fields.length > 0 &&
                    !editAccessories &&
                    fields.map((_, index) => (
                        <div key={index}>
                            <Typography element="p">
                                {getValues(`accessories.${index}.model`) === ""
                                    ? displaySingularAccessoryType(accessoryType!) +
                                      " " +
                                      (index + 1)
                                    : getValues(`accessories.${index}.model`)}
                                {getValues(`accessories.${index}.series_number`) === ""
                                    ? ""
                                    : " - " + getValues(`accessories.${index}.series_number`)}
                            </Typography>

                            <Typography element="span" variant="danger">
                                {errors?.accessories?.[index]
                                    ? "Há campos inválidos nesse acessório. Acesse os acessórios para corrigir."
                                    : null}
                            </Typography>
                        </div>
                    ))}

                {renderButtons()}
            </Form>
        </div>
    );
};

export default EditEquipmentForm;
