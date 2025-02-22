"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { equipmentSchema } from "@/schemas";

import { useCreateAddEquipmentOperationMutation } from "@/redux/features/equipmentApiSlice";
import { isErrorWithMessages } from "@/redux/services/helpers";

import { Button, Spinner } from "@/components/common";
import { Form, Input, Select } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { useAppDispatch } from "@/redux/hooks";
import { closeModal } from "@/redux/features/modalSlice";
import { useEffect, useState } from "react";
import {
    AccessoryType,
    useListModalitiesQuery,
} from "@/redux/features/modalityApiSlice";
import { SelectData } from "./Select";

export type AddEquipmentFields = z.infer<typeof equipmentSchema>;

type AddEquipmentFormProps = {
    unitId: number;
};

const AddEquipmentForm = ({ unitId }: AddEquipmentFormProps) => {
    const dispatch = useAppDispatch();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<AddEquipmentFields>({
        resolver: zodResolver(equipmentSchema),
    });

    const {
        data: modalities,
        isLoading: isLoadingModalities,
        isError: isErrorModalities,
    } = useListModalitiesQuery();

    const [createAddEquipmentOperation] =
        useCreateAddEquipmentOperationMutation();

    const [modalityOptions, setModalityOptions] = useState<SelectData[]>();
    const [selectedModality, setSelectedModality] = useState<SelectData>();
    const [accessoryType, setAccessoryType] = useState<AccessoryType>();
    const [addAccessory, setAddAccessory] = useState(false);
    const [accessoryIndex, setAccessoryIndex] = useState(0);

    const onSubmit: SubmitHandler<AddEquipmentFields> = async (data) => {
        if (!isLoadingModalities) {
            toast.warning("Aguarde o carregamento das modalidades.");
            return;
        }

        const formData = new FormData();

        // Handle text fields
        formData.append("modality", data.modality.toString());
        formData.append("manufacturer", data.manufacturer);
        formData.append("model", data.model);
        formData.append("series_number", data.series_number);
        formData.append("anvisa_registry", data.anvisa_registry);
        formData.append("unit", unitId.toString());

        // Handle file fields
        formData.append("equipment_photo", data.equipment_photo[0]);
        formData.append("label_photo", data.label_photo[0]);

        try {
            const response = await createAddEquipmentOperation(formData);

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

    // Set the modality options when the modalities are loaded
    useEffect(() => {
        if (modalities && modalities.length > 0) {
            setModalityOptions(
                modalities.map((modality) => ({
                    id: modality.id,
                    value: modality.name,
                }))
            );
            setSelectedModality({
                id: modalities[0].id,
                value: modalities[0].name,
            });
        }
    }, [modalities]);

    // Set the value for the modality field when the modalities are loaded
    // and when the selected modality changes
    // Also set the accessory type based on the selected modality
    useEffect(() => {
        if (selectedModality) {
            setValue("modality", selectedModality.id);

            const modality = modalities?.find(
                (modality) => modality.id === selectedModality.id
            );
            console.log(modality?.accessory_type);
            setAccessoryType(modality?.accessory_type);
        }
    }, [selectedModality]);

    const handleAddAccessory = () => {
        setAddAccessory(false);
        setAccessoryIndex((prev) => prev + 1);
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

                <Input
                    {...register("label_photo")}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    errorMessage={errors.label_photo?.message}
                    data-testid="equipment-label-input"
                >
                    Foto do rótulo do equipamento
                </Input>
            </>
        );
    };

    const renderAccessoryInputs = () => {
        return (
            <>
                <Input
                    {...register(`accessories.${accessoryIndex}.model`)}
                    type="text"
                    errorMessage={
                        errors.accessories?.[accessoryIndex]?.model?.message
                    }
                    placeholder="Digite o nome do modelo"
                    data-testid="equipment-model-input"
                >
                    Modelo
                </Input>

                <Input
                    {...register(`accessories.${accessoryIndex}.series_number`)}
                    type="text"
                    errorMessage={
                        errors.accessories?.[accessoryIndex]?.series_number
                            ?.message
                    }
                    placeholder="Digite o número de série, se houver"
                    data-testid="equipment-series-number-input"
                >
                    Número de série
                </Input>

                <Input
                    {...register(
                        `accessories.${accessoryIndex}.equipment_photo`
                    )}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    errorMessage={
                        errors.accessories?.[accessoryIndex]?.equipment_photo
                            ?.message
                    }
                    data-testid="equipment-photo-input"
                >
                    Foto do equipamento
                </Input>

                <Input
                    {...register(`accessories.${accessoryIndex}.label_photo`)}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    errorMessage={
                        errors.accessories?.[accessoryIndex]?.label_photo
                            ?.message
                    }
                    data-testid="equipment-label-input"
                >
                    Foto do rótulo do equipamento
                </Input>
            </>
        );
    };

    if (isErrorModalities) {
        toast.error("Algo deu errado. Tente novamente mais tarde.");
        dispatch(closeModal());
        return null;
    }

    const renderButtons = () => {
        if (accessoryType === AccessoryType.NONE && !addAccessory) {
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

        if (accessoryType !== AccessoryType.NONE && !addAccessory) {
            return (
                <div>
                    <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => {
                            setAddAccessory(true);
                        }}
                        variant="secondary"
                        data-testid="submit-btn"
                        className="w-full"
                    >
                        Adicionar acessório
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
                            Requisitar sem acessório
                        </Button>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex gap-2 py-4">
                <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setAddAccessory(false)}
                    variant="secondary"
                    data-testid="cancel-btn"
                    className="w-full"
                >
                    Cancelar
                </Button>
                <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setAddAccessory(false)}
                    data-testid="submit-btn"
                    className="w-full"
                >
                    Adicionar
                </Button>
            </div>
        );
    };

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

                {!addAccessory && renderEquipmentInputs()}
                {addAccessory && renderAccessoryInputs()}

                {accessoryType === AccessoryType.NONE && !addAccessory ? (
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
                ) : (
                    <div>
                        <Button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => {
                                setAddAccessory(true);
                            }}
                            variant="secondary"
                            data-testid="submit-btn"
                            className="w-full"
                        >
                            Adicionar acessório
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
                                Requisitar sem acessório
                            </Button>
                        </div>
                    </div>
                )}
            </Form>
        </div>
    );
};

export default AddEquipmentForm;
