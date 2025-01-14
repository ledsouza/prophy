"use client";

import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import { equipmentSchema } from "@/schemas";
import { OperationType } from "@/enums";

import { isErrorWithMessage, isResponseError } from "@/redux/services/helpers";
import {
    EquipmentDTO,
    useCreateEquipmentOperationMutation,
} from "@/redux/features/equipmentApiSlice";

import { Button } from "@/components/common";
import { Typography } from "@/components/foundation";
import { Form, Input } from "@/components/forms";

export type EditEquipmentFields = z.infer<typeof equipmentSchema>;

type EditEquipmentFormProps = {
    originalEquipment: EquipmentDTO;
    setIsModalOpen: (value: boolean) => void;
};

const EditEquipmentForm = ({
    originalEquipment,
    setIsModalOpen,
}: EditEquipmentFormProps) => {
    const [equipmentPhotoFile, setEquipmentPhotoFile] = useState<File | null>(
        null
    );

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<EditEquipmentFields>({
        resolver: zodResolver(equipmentSchema),
        defaultValues: {
            modality: originalEquipment.modality,
            manufacturer: originalEquipment.manufacturer,
            model: originalEquipment.model,
            series_number: originalEquipment.series_number,
            anvisa_registry: originalEquipment.anvisa_registry,
        },
    });

    const [createEquipmentOperation] = useCreateEquipmentOperationMutation();

    const onSubmit: SubmitHandler<EditEquipmentFields> = async (data) => {
        if (
            Object.entries(data).every(([key, value]) => {
                if (typeof value === "string") {
                    return (
                        value.toLowerCase() ===
                        originalEquipment[key as keyof EquipmentDTO]
                            ?.toString()
                            .toLowerCase()
                    );
                } else if (value instanceof FileList) {
                    return (
                        value.item(0)?.name ===
                        originalEquipment.equipment_photo?.split("/").pop()
                    );
                }
            })
        ) {
            toast.warning("Nenhuma alteração foi detectada nos dados.");
            return;
        }

        const formData = new FormData();

        // Handle text fields
        formData.append("original_equipment", originalEquipment.id.toString());
        formData.append("unit", originalEquipment.unit.toString());
        formData.append("operation_type", OperationType.EDIT);
        formData.append("modality", data.modality);
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
        }

        const isSameData = Array.from(formData.entries()).every(
            ([key, value]) => {
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
                    return (
                        value.name ===
                        originalEquipment.equipment_photo?.split("/").pop()
                    );
                }
            }
        );

        if (isSameData) {
            return toast.warning("Nenhuma alteração foi detectada nos dados.");
        }

        try {
            const response = await createEquipmentOperation(formData);

            if (response.error) {
                if (isErrorWithMessage(response.error)) {
                    toast.error(response.error.data.messages[0]);
                    return;
                }
                if (isResponseError(response.error)) {
                    toast.error("Algo deu errado. Tente novamente mais tarde.");
                    return;
                }
            }

            toast.success("Requisição enviada com sucesso!");
            setIsModalOpen(false);
        } catch (error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }
    };

    useEffect(() => {
        if (originalEquipment.equipment_photo) {
            fetch(
                process.env.NEXT_PUBLIC_HOST + originalEquipment.equipment_photo
            )
                .then((response) => response.blob())
                .then((blob) => {
                    const filename =
                        originalEquipment.equipment_photo?.split("/").pop() ||
                        "Não definido";
                    const file = new File([blob], filename, {
                        type: blob.type,
                    });
                    setEquipmentPhotoFile(file);
                });
        }
    }, []);

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

                <Input
                    {...register("modality")}
                    type="text"
                    errorMessage={errors.modality?.message}
                    placeholder="Digite o nome da modalidade"
                    data-testid="equipment-modality-input"
                >
                    Modalidade
                </Input>

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

                <div className="flex gap-2 py-4">
                    <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setIsModalOpen(false)}
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
