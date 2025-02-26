"use client";

import { useEffect, useState } from "react";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { accessorySchema, equipmentSchema, optionalFileSchema } from "@/schemas";

import { isErrorWithMessages } from "@/redux/services/helpers";
import {
    EquipmentDTO,
    useCreateEditEquipmentOperationMutation,
} from "@/redux/features/equipmentApiSlice";
import { AccessoryDTO, useGetAccessoriesQuery } from "@/redux/features/accessoryApiSlice";
import { AccessoryType } from "@/redux/features/modalityApiSlice";
import { closeModal } from "@/redux/features/modalSlice";
import { useAppDispatch } from "@/redux/hooks";

import { fetchPhoto } from "@/utils/media";
import { useModality } from "@/hooks/use-modality";

import { Button, Spinner } from "@/components/common";
import { Typography } from "@/components/foundation";
import { Form, Input, Select } from "@/components/forms";
import { displaySingularAccessoryType } from "@/utils/format";

const editAccessorySchema = accessorySchema
    .extend({
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
    originalEquipment: EquipmentDTO;
};

const EditEquipmentForm = ({ originalEquipment }: EditEquipmentFormProps) => {
    const dispatch = useAppDispatch();

    const [equipmentPhotoFile, setEquipmentPhotoFile] = useState<File | null>(null);
    const [equipmentLabelPhotoFile, setEquipmentLabelPhotoFile] = useState<File | null>(null);

    const [filteredAccessories, setFilteredAccessories] = useState<AccessoryDTO[]>([]);
    const [filteredFormAccessories, setFilteredFormAccessories] = useState<
        z.infer<typeof editAccessorySchema>[]
    >([]);

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
            manufacturer: originalEquipment.manufacturer,
            model: originalEquipment.model,
            series_number: originalEquipment.series_number,
            anvisa_registry: originalEquipment.anvisa_registry,
            accessories: filteredFormAccessories,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "accessories",
    });

    const {
        modalityOptions,
        selectedModality,
        setSelectedModality,
        accessoryType,
        isErrorModalities,
        isLoadingModalities,
    } = useModality(setValue, originalEquipment.modality);

    const [createEditEquipmentOperation] = useCreateEditEquipmentOperationMutation();

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
                    return value === originalEquipment.modality.id.toString();
                } else {
                    return (
                        value.toLowerCase() ===
                        originalEquipment[key as keyof EquipmentDTO]?.toString().toLowerCase()
                    );
                }
            } else if (value instanceof File) {
                const originalFile = originalEquipment[key as keyof EquipmentDTO] as
                    | string
                    | undefined;
                return value.name === originalFile?.split("/").pop();
            }
        });

        const sameAccessories = accessoriesFormData.every((accessoryFormData, index) => {
            // Ensure we have a corresponding filtered accessory
            // If the length is different, that means the user removed or added an accessory
            if (accessoriesFormData.length !== filteredAccessories.length) {
                return false;
            }

            // If the length is equal and accessoriesFormData length is zero
            // there is no reason to compare any data
            if (accessoriesFormData.length === 0) {
                return true;
            }

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

    const renderEquipmentInputs = () => {
        return (
            <>
                {modalityOptions && selectedModality ? (
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
                )}

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

                {originalEquipment.equipment_photo && (
                    <Typography element="p" size="sm">
                        Nome do arquivo atual: {originalEquipment.equipment_photo.split("/").pop()}
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

                {originalEquipment.label_photo && (
                    <Typography element="p" size="sm">
                        Nome do arquivo atual: {originalEquipment.label_photo.split("/").pop()}
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
                <div className="flex gap-2 py-4">
                    <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => dispatch(closeModal())}
                        variant="secondary"
                        data-testid="cancel-btn"
                        className="w-full"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        data-testid="submit-btn"
                        className="w-full"
                    >
                        Requisitar
                    </Button>
                </div>
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
                    <div className="flex gap-2 py-4">
                        <Button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => dispatch(closeModal())}
                            variant="secondary"
                            data-testid="cancel-btn"
                            className="w-full"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            data-testid="submit-btn"
                            className="w-full"
                        >
                            Requisitar
                        </Button>
                    </div>
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

        const equipmentFormData = new FormData();
        const accessoriesFormData: FormData[] = [];

        // Handle text fields
        equipmentFormData.append("original_equipment", originalEquipment.id.toString());
        equipmentFormData.append("unit", originalEquipment.unit.toString());
        equipmentFormData.append("modality", data.modality.toString());
        equipmentFormData.append("manufacturer", data.manufacturer);
        equipmentFormData.append("model", data.model);
        equipmentFormData.append("series_number", data.series_number);
        equipmentFormData.append("anvisa_registry", data.anvisa_registry);

        // Set the accessories to check if there is any change in the data
        fields.forEach(async (accessory, index) => {
            const accessoryFormData = new FormData();
            accessoryFormData.append("model", accessory.model);
            accessoryFormData.append("series_number", accessory.series_number);

            // Check if the user uploaded a new photo to append.
            // Otherwise, use the original photo.
            if (accessory.equipment_photo?.[0]) {
                accessoryFormData.append("equipment_photo", accessory.equipment_photo[0]);
            } else if (filteredAccessories[index].equipment_photo) {
                const equipmentPhotoFile = await handleAccessoryPhoto(
                    filteredAccessories[index].equipment_photo
                );
                accessoryFormData.append("equipment_photo", equipmentPhotoFile);
            }

            if (accessory.label_photo?.[0]) {
                accessoryFormData.append("label_photo", accessory.label_photo[0]);
            } else if (filteredAccessories[index].label_photo) {
                const equipmentLabelPhotoFile = await handleAccessoryPhoto(
                    filteredAccessories[index].label_photo
                );
                accessoryFormData.append("label_photo", equipmentLabelPhotoFile);
            }

            accessoriesFormData.push(accessoryFormData);
        });

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

        if (isSameData(equipmentFormData, accessoriesFormData)) {
            return toast.warning("Nenhuma alteração foi detectada nos dados.");
        }

        console.log(data);

        // try {
        //     const response = await createEditEquipmentOperation(equipmentFormData);
        //     console.log(response);

        //     if (response.error) {
        //         if (isErrorWithMessages(response.error)) {
        //             toast.error(response.error.data.messages[0]);
        //             return;
        //         }

        //         return toast.error("Algo deu errado. Tente novamente mais tarde.");
        //     }

        //     toast.success("Requisição enviada com sucesso!");
        //     dispatch(closeModal());
        // } catch (error) {
        //     toast.error("Algo deu errado. Tente novamente mais tarde.");
        // }
    };

    // Convert accessories to form data type
    useEffect(() => {
        if (!filteredAccessories || isLoadingAccessories) {
            return;
        }

        setFilteredFormAccessories(
            filteredAccessories.map((accessory) => ({
                model: accessory.model,
                series_number: accessory.series_number,
                equipment_photo: new FileList(),
                label_photo: new FileList(),
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
            accessories.filter((accessory) => accessory.equipment === originalEquipment.id)
        );
    }, [accessories]);

    // Fetch accessories photos from the server
    useEffect(() => {
        if (originalEquipment.equipment_photo) {
            try {
                handleEquipmentPhoto(originalEquipment.equipment_photo);
            } catch (error) {
                toast.error("Erro ao carregar a foto do equipamento.");
            }
        }

        if (originalEquipment.label_photo) {
            try {
                handleEquipmentPhoto(originalEquipment.label_photo);
            } catch (error) {
                toast.error("Erro ao carregar a foto do rótulo do equipamento.");
            }
        }
    }, [originalEquipment]);

    // Fetch equipment photos from the server
    useEffect(() => {
        if (originalEquipment.equipment_photo) {
            try {
                handleEquipmentPhoto(originalEquipment.equipment_photo);
            } catch (error) {
                toast.error("Erro ao carregar a foto do equipamento.");
            }
        }

        if (originalEquipment.label_photo) {
            try {
                handleEquipmentLabelPhoto(originalEquipment.label_photo);
            } catch (error) {
                toast.error("Erro ao carregar a foto do rótulo do equipamento.");
            }
        }
    }, [originalEquipment]);

    if (isErrorModalities || isErrorAccessories) {
        toast.error("Algo deu errado. Tente novamente mais tarde.");
        dispatch(closeModal());
        return null;
    }

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Typography element="h3" size="title3" className="font-semibold">
                    Informe os dados do equipamento
                </Typography>
                <Typography element="p" size="md" className="text-justify">
                    Por favor, preencha os campos abaixo com as informações do equipamento,
                    certificando-se de preencher as informações corretamente. Após a submissão, o
                    formulário será enviado para análise de um físico médico responsável, que fará a
                    revisão e validação das informações fornecidas.
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
