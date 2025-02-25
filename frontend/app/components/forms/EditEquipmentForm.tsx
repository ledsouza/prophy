"use client";

import { useEffect, useState } from "react";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { accessorySchema, equipmentSchema } from "@/schemas";

import { isErrorWithMessages } from "@/redux/services/helpers";
import {
    EquipmentDTO,
    useCreateEditEquipmentOperationMutation,
} from "@/redux/features/equipmentApiSlice";
import { closeModal } from "@/redux/features/modalSlice";
import { useAppDispatch } from "@/redux/hooks";

import { fetchPhoto } from "@/utils/media";
import { useModality } from "@/hooks/use-modality";

import { Button, Spinner } from "@/components/common";
import { Typography } from "@/components/foundation";
import { Form, Input, Select } from "@/components/forms";
import requiredFileSchema from "@/schemas/file-schema";

const editAccessorySchema = accessorySchema.extend({
    equipment_photo: requiredFileSchema.optional(),
    label_photo: requiredFileSchema.optional(),
});

const editEquipmentSchema = equipmentSchema.extend({
    equipment_photo: requiredFileSchema.optional(),
    label_photo: requiredFileSchema.optional(),
    accessories: z.array(editAccessorySchema),
});

export type EditEquipmentFields = z.infer<typeof equipmentSchema>;

type EditEquipmentFormProps = {
    originalEquipment: EquipmentDTO;
};

const EditEquipmentForm = ({ originalEquipment }: EditEquipmentFormProps) => {
    const dispatch = useAppDispatch();
    const [equipmentPhotoFile, setEquipmentPhotoFile] = useState<File | null>(
        null
    );
    const [equipmentLabelPhotoFile, setEquipmentLabelPhotoFile] =
        useState<File | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<EditEquipmentFields>({
        resolver: zodResolver(equipmentSchema),
        defaultValues: {
            manufacturer: originalEquipment.manufacturer,
            model: originalEquipment.model,
            series_number: originalEquipment.series_number,
            anvisa_registry: originalEquipment.anvisa_registry,
            // accessories: [],
        },
    });

    const {
        modalityOptions,
        selectedModality,
        setSelectedModality,
        accessoryType,
        isErrorModalities,
        isLoadingModalities,
    } = useModality(setValue, originalEquipment.modality);

    const [createEditEquipmentOperation] =
        useCreateEditEquipmentOperationMutation();

    const onSubmit: SubmitHandler<EditEquipmentFields> = async (data) => {
        if (isLoadingModalities) {
            toast.warning("Aguarde o carregamento das modalidades.");
            return;
        }

        const formData = new FormData();

        console.log("FormData entries:");
        formData.forEach((value, key) => {
            console.log(
                `${key}: ${value instanceof File ? value.name : value}`
            );
        });

        // Handle text fields
        formData.append("original_equipment", originalEquipment.id.toString());
        formData.append("unit", originalEquipment.unit.toString());
        formData.append("modality", data.modality.toString());
        formData.append("manufacturer", data.manufacturer);
        formData.append("model", data.model);
        formData.append("series_number", data.series_number);
        formData.append("anvisa_registry", data.anvisa_registry);

        // Handle file uploads - check if files exist before appending
        if (data.equipment_photo?.[0]) {
            formData.append("equipment_photo", data.equipment_photo[0]);
        } else if (equipmentPhotoFile) {
            formData.append("equipment_photo", equipmentPhotoFile);
        }

        if (data.label_photo?.[0]) {
            formData.append("label_photo", data.label_photo[0]);
        } else if (equipmentLabelPhotoFile) {
            formData.append("label_photo", equipmentLabelPhotoFile);
        }

        const isSameData = Array.from(formData.entries()).every(
            ([key, value]) => {
                console.log(key, value);
                if (typeof value === "string") {
                    if (key === "original_equipment") {
                        return (
                            value.toLowerCase() ===
                            originalEquipment.id?.toString().toLowerCase()
                        );
                    } else if (key === "operation_type") {
                        return true;
                    } else {
                        return (
                            value.toLowerCase() ===
                            originalEquipment[key as keyof EquipmentDTO]
                                ?.toString()
                                .toLowerCase()
                        );
                    }
                } else if (value instanceof File) {
                    const originalFile = originalEquipment[
                        key as keyof EquipmentDTO
                    ] as string | undefined;
                    return value.name === originalFile?.split("/").pop();
                }
            }
        );

        if (isSameData) {
            return toast.warning("Nenhuma alteração foi detectada nos dados.");
        }

        try {
            const response = await createEditEquipmentOperation(formData);
            console.log(response);

            if (response.error) {
                if (isErrorWithMessages(response.error)) {
                    toast.error(response.error.data.messages[0]);
                    return;
                }

                return toast.error(
                    "Algo deu errado. Tente novamente mais tarde."
                );
            }

            toast.success("Requisição enviada com sucesso!");
            dispatch(closeModal());
        } catch (error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }
    };

    useEffect(() => {
        if (originalEquipment.equipment_photo) {
            try {
                fetchPhoto(
                    originalEquipment.equipment_photo,
                    setEquipmentPhotoFile
                );
            } catch (error) {
                toast.error("Erro ao carregar a foto do equipamento.");
            }
        }

        if (originalEquipment.label_photo) {
            try {
                fetchPhoto(
                    originalEquipment.label_photo,
                    setEquipmentLabelPhotoFile
                );
            } catch (error) {
                toast.error(
                    "Erro ao carregar a foto do rótulo do equipamento."
                );
            }
        }
    }, [originalEquipment]);

    if (isErrorModalities) {
        toast.error("Algo deu errado. Tente novamente mais tarde.");
        dispatch(closeModal());
        return null;
    }

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Typography
                    element="h3"
                    size="title3"
                    className="font-semibold"
                >
                    Informe os dados do equipamento
                </Typography>
                <Typography element="p" size="md" className="text-justify">
                    Por favor, preencha os campos abaixo com as informações do
                    equipamento, certificando-se de preencher as informações
                    corretamente. Após a submissão, o formulário será enviado
                    para análise de um físico médico responsável, que fará a
                    revisão e validação das informações fornecidas.
                </Typography>

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
                        <Typography
                            element="p"
                            size="md"
                            className="text-center"
                        >
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
                        Nome do arquivo atual:{" "}
                        {originalEquipment.equipment_photo.split("/").pop()}
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
                        Nome do arquivo atual:{" "}
                        {originalEquipment.label_photo.split("/").pop()}
                    </Typography>
                )}

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
            </Form>
        </div>
    );
};

export default EditEquipmentForm;
