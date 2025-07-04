"use client";

import { useState } from "react";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import AccessoryCreationError from "@/errors/accessory-error";
import { accessorySchema, equipmentSchema, requiredFileSchema } from "@/schemas";

import { useCreateAddEquipmentOperationMutation } from "@/redux/features/equipmentApiSlice";
import { useCreateAccessoryMutation } from "@/redux/features/accessoryApiSlice";
import { AccessoryType } from "@/redux/features/modalityApiSlice";
import { closeModal } from "@/redux/features/modalSlice";
import { useAppDispatch } from "@/redux/hooks";

import { displaySingularAccessoryType } from "@/utils/format";
import { useModality } from "@/hooks/use-modality";

import { Button, Spinner } from "@/components/common";
import { Form, Input, Select } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { useNeedReview } from "@/hooks";
import { OperationStatus } from "@/enums";

const addAccessorySchema = accessorySchema.extend({
    equipment_photo: requiredFileSchema,
    label_photo: requiredFileSchema,
});

const addEquipmentSchema = equipmentSchema.extend({
    equipment_photo: requiredFileSchema,
    label_photo: requiredFileSchema,
    accessories: z.array(addAccessorySchema),
});

export type AddEquipmentFields = z.infer<typeof addEquipmentSchema>;

type AddEquipmentFormProps = {
    unitId: number;
};

type AccessoryFields = AddEquipmentFields["accessories"][0];

const AddEquipmentForm = ({ unitId }: AddEquipmentFormProps) => {
    const dispatch = useAppDispatch();

    const {
        register,
        control,
        handleSubmit,
        setValue,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<AddEquipmentFields>({
        resolver: zodResolver(addEquipmentSchema),
        defaultValues: {
            accessories: [],
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
    } = useModality(setValue);

    const { needReview } = useNeedReview();
    const [createAddEquipmentOperation] = useCreateAddEquipmentOperationMutation();

    const [createAccessory] = useCreateAccessoryMutation();

    const [addAccessory, setAddAccessory] = useState(false);

    const handleCreateAccessory = async (accessory: AccessoryFields, equipmentID: number) => {
        if (!accessoryType) {
            throw new Error("Accessory type not set.");
        }

        const accessoryFormData = new FormData();
        accessoryFormData.append("manufacturer", accessory.manufacturer);
        accessoryFormData.append("model", accessory.model);
        accessoryFormData.append("series_number", accessory.series_number);
        accessoryFormData.append("equipment_photo", accessory.equipment_photo[0]);
        accessoryFormData.append("label_photo", accessory.label_photo[0]);
        accessoryFormData.append("equipment", equipmentID.toString());
        accessoryFormData.append("category", accessoryType.toString());

        try {
            const accessoryResponse = await createAccessory(accessoryFormData);
            if (accessoryResponse.error) {
                throw new AccessoryCreationError(
                    `Error creating accessory: ${accessoryResponse.error}`
                );
            }
        } catch (error) {
            throw error;
        }
    };

    const handleCreateAccessories = async (accessories: AccessoryFields[], equipmentID: number) => {
        if (accessories.length === 0) {
            return;
        }

        await Promise.all(
            accessories.map(async (accessory) => {
                await handleCreateAccessory(accessory, equipmentID);
            })
        );
    };

    const onSubmit: SubmitHandler<AddEquipmentFields> = async (data) => {
        if (isLoadingModalities) {
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
        if (!needReview) {
            formData.append("operation_status", OperationStatus.ACCEPTED);
        }

        // Handle file fields
        formData.append("equipment_photo", data.equipment_photo[0]);
        formData.append("label_photo", data.label_photo[0]);

        try {
            const equipmentResponse = await createAddEquipmentOperation(formData);

            if (equipmentResponse.error) {
                throw new Error(`Error creating equipment: ${equipmentResponse.error}`);
            }

            await handleCreateAccessories(data.accessories, equipmentResponse.data.id);

            const successMessage = needReview
                ? "Requisição enviada com sucesso."
                : "Equipamento adicionado com sucesso.";

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

    const handleAddAccessory = () => {
        if (fields.length === 0) {
            append({
                manufacturer: "",
                model: "",
                series_number: "",
                equipment_photo: new DataTransfer().files,
                label_photo: new DataTransfer().files,
            });
        }
        setAddAccessory(true);
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
                    {...register(`accessories.${accessoryIndex}.manufacturer`)}
                    type="text"
                    errorMessage={errors.accessories?.[accessoryIndex]?.manufacturer?.message}
                    placeholder="Digite o nome do fabricante"
                    data-testid={`equipment-manufacturer-input-${accessoryIndex}`}
                >
                    Fabricante
                </Input>

                <Input
                    {...register(`accessories.${accessoryIndex}.model`)}
                    type="text"
                    errorMessage={errors.accessories?.[accessoryIndex]?.model?.message}
                    placeholder="Digite o nome do modelo"
                    data-testid={`equipment-model-input-${accessoryIndex}`}
                >
                    Modelo
                </Input>

                <Input
                    {...register(`accessories.${accessoryIndex}.series_number`)}
                    type="text"
                    errorMessage={errors.accessories?.[accessoryIndex]?.series_number?.message}
                    placeholder="Digite o número de série, se houver"
                    data-testid={`equipment-series-number-input-${accessoryIndex}`}
                >
                    Número de série
                </Input>

                <Input
                    {...register(`accessories.${accessoryIndex}.equipment_photo`)}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    errorMessage={errors.accessories?.[accessoryIndex]?.equipment_photo?.message}
                    data-testid={`equipment-photo-input-${accessoryIndex}`}
                >
                    Foto do equipamento
                </Input>

                <Input
                    {...register(`accessories.${accessoryIndex}.label_photo`)}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    errorMessage={errors.accessories?.[accessoryIndex]?.label_photo?.message}
                    data-testid={`equipment-label-input-${accessoryIndex}`}
                >
                    Foto do rótulo do equipamento
                </Input>
            </div>
        );
    };

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
                        {needReview ? "Requisitar" : "Adicionar"}
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
                            {needReview ? "Requisitar" : "Adicionar"}
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
                    onClick={() =>
                        append({
                            manufacturer: "",
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
                    onClick={() => setAddAccessory(false)}
                    variant="primary"
                    data-testid="cancel-btn"
                    className="w-full"
                >
                    Concluir
                </Button>
            </div>
        );
    };

    if (isErrorModalities) {
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

                {!addAccessory && (
                    <Typography element="p" size="md" className="text-justify">
                        Alguns equipamentos podem possuir acessórios. Caso o equipamento que você
                        deseja requisitar possua acessórios, clique no botão "Acessórios" para
                        adicionar os acessórios necessários.
                    </Typography>
                )}

                {!addAccessory && renderEquipmentInputs()}
                {addAccessory && fields.map((_, index) => renderAccessoryInputs(index, remove))}

                {addAccessory && fields.length === 0 && (
                    <Typography element="p" className="font-semibold">
                        Nenhum acessório adicionado. Clique em "Adicionar um{" "}
                        {displaySingularAccessoryType(accessoryType!)}" para adicionar um acessório.
                    </Typography>
                )}

                {fields.length > 0 && !addAccessory && (
                    <Typography element="p" className="font-semibold">
                        Acessórios adicionados:
                    </Typography>
                )}
                {fields.length > 0 &&
                    !addAccessory &&
                    fields.map((_, index) => (
                        <div>
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

export default AddEquipmentForm;
