"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import AccessoryCreationError from "@/errors/accessory-error";
import { accessorySchema, equipmentSchema, optionalFileSchema } from "@/schemas";

import {
    AccessoryDTO,
    useCreateAccessoryMutation,
    useDeleteAccessoryMutation,
    useGetAccessoriesQuery,
    useUpdateAccessoryMutation,
} from "@/redux/features/accessoryApiSlice";
import {
    EquipmentDTO,
    EquipmentOperationDTO,
    useCreateEditEquipmentOperationMutation,
    useEditEquipmentMutation,
} from "@/redux/features/equipmentApiSlice";
import { AccessoryType } from "@/redux/features/modalityApiSlice";
import { closeModal } from "@/redux/features/modalSlice";
import { useAppDispatch } from "@/redux/hooks";

import { useNeedReview } from "@/hooks";
import { useModality } from "@/hooks/use-modality";
import useRequireAuth from "@/hooks/use-require-auth";
import { displaySingularAccessoryType } from "@/utils/format";
import { fetchPhoto } from "@/utils/media";

import { Button, Modal, Spinner } from "@/components/common";
import { Form, FormButtons, Input, Select, Textarea } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { OperationStatus } from "@/enums";
import Role from "@/enums/Role";
import { XCircle } from "@phosphor-icons/react";

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

type ViewImageButtonProps = {
    imageEndpoint: string;
    imageTitle: string;
    className?: string;
};

type EditEquipmentFormProps = {
    title?: string;
    description?: string;
    disabled?: boolean;
    reviewMode?: boolean;
    equipment: EquipmentDTO | EquipmentOperationDTO;
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
    const [removedAccessoryIds, setRemovedAccessoryIds] = useState<number[]>([]);

    // Image modal state
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
    const [currentImageTitle, setCurrentImageTitle] = useState<string>("");

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
            channels: equipment.channels || "",
            official_max_load: equipment.official_max_load || undefined,
            usual_max_load: equipment.usual_max_load || undefined,
            purchase_installation_date: equipment.purchase_installation_date || "",
            maintenance_responsable: equipment.maintenance_responsable || "",
            email_maintenance_responsable: equipment.email_maintenance_responsable || "",
            phone_maintenance_responsable: equipment.phone_maintenance_responsable || "",
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
    const [deleteAccessory] = useDeleteAccessoryMutation();

    const handleAccessoryPhoto = async (endpoint: string) => {
        const accessoryPhoto = await fetchPhoto(endpoint);
        return accessoryPhoto;
    };

    const handleEquipmentPhotoFetch = async (endpoint: string, isLabelPhoto: boolean = false) => {
        const photo = await fetchPhoto(endpoint);
        if (isLabelPhoto) {
            setEquipmentLabelPhotoFile(photo);
        } else {
            setEquipmentPhotoFile(photo);
        }
    };

    const handleAddAccessory = () => {
        setEditAccessories(true);
    };

    const handleRemoveAccessory = (index: number) => {
        const accessories = getValues("accessories");
        const accessoryToRemove = accessories[index];

        if (accessoryToRemove && accessoryToRemove.id) {
            setRemovedAccessoryIds((prevIds) => [...prevIds, accessoryToRemove.id!]);
        }
        remove(index);
    };

    const handleViewImage = (imageEndpoint: string, title: string) => {
        setCurrentImageUrl(process.env.NEXT_PUBLIC_HOST + imageEndpoint);
        setCurrentImageTitle(title);
        setImageModalOpen(true);
    };

    const isSameData = (equipmentFormData: FormData, accessoriesFormData: FormData[]) => {
        // Check if any accessories were removed
        if (removedAccessoryIds.length > 0) {
            return false;
        }

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
        if (needReview) {
            equipmentFormData.append("original_equipment", equipment.id.toString());
        }
        equipmentFormData.append("unit", equipment.unit.toString());
        equipmentFormData.append("modality", data.modality.toString());
        equipmentFormData.append("manufacturer", data.manufacturer);
        equipmentFormData.append("model", data.model);
        equipmentFormData.append("series_number", data.series_number);
        equipmentFormData.append("anvisa_registry", data.anvisa_registry);

        // Add additional fields if user has appropriate role
        if (
            !reviewMode &&
            !needReview &&
            (userData?.role === Role.FMI || userData?.role === Role.GP)
        ) {
            if (data.channels) equipmentFormData.append("channels", data.channels);
            if (data.official_max_load)
                equipmentFormData.append("official_max_load", data.official_max_load.toString());
            if (data.usual_max_load)
                equipmentFormData.append("usual_max_load", data.usual_max_load.toString());
            if (data.purchase_installation_date)
                equipmentFormData.append(
                    "purchase_installation_date",
                    data.purchase_installation_date
                );
            if (data.maintenance_responsable)
                equipmentFormData.append("maintenance_responsable", data.maintenance_responsable);
            if (data.email_maintenance_responsable)
                equipmentFormData.append(
                    "email_maintenance_responsable",
                    data.email_maintenance_responsable
                );
            if (data.phone_maintenance_responsable)
                equipmentFormData.append(
                    "phone_maintenance_responsable",
                    data.phone_maintenance_responsable
                );
        }

        if (data.note) {
            equipmentFormData.append("note", data.note);
        }

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

        if (!needReview) {
            isRejected
                ? equipmentFormData.append("operation_status", OperationStatus.REJECTED)
                : equipmentFormData.append("operation_status", OperationStatus.ACCEPTED);
        }

        return equipmentFormData;
    };

    const createAccessoryForm = async () => {
        const accessoriesFields = getValues("accessories");

        const accessoriesFormDataPromises = accessoriesFields.map(async (accessory, index) => {
            const accessoryFormData = new FormData();
            accessoryFormData.append("manufacturer", accessory.manufacturer);
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
        equipment: EquipmentDTO | EquipmentOperationDTO
    ) => {
        const accessoriesFields = getValues("accessories");

        const promises = accessoriesForm.map(async (formData, index) => {
            // Add common fields
            formData.append("category", accessoryType ? accessoryType : AccessoryType.NONE);

            // Check if this is an existing accessory (has ID) or a new one
            const accessory = accessoriesFields[index];

            if (accessory.id && !needReview) {
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
                formData.append("equipment", equipment.id.toString());
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

    const ViewImageButton = ({ imageEndpoint, imageTitle, className }: ViewImageButtonProps) => {
        return (
            (reviewMode || disabled) && (
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleViewImage(imageEndpoint, imageTitle)}
                    className={`whitespace-nowrap ${className || ""}`}
                >
                    Ver imagem
                </Button>
            )
        );
    };

    const renderEquipmentInputs = () => {
        if (isRejected) {
            return (
                <Textarea
                    {...register("note")}
                    rows={18}
                    errorMessage={errors.note?.message}
                    placeholder="Justifique o motivo da rejeição"
                    data-testid="rejection-note-input"
                />
            );
        }

        return (
            <>
                {userData?.role !== Role.GGC &&
                    (modalityOptions && selectedModality ? (
                        <Select
                            options={modalityOptions}
                            selectedData={selectedModality}
                            setSelect={setSelectedModality}
                            label="Modalidade"
                            labelSize="sm"
                            listBoxButtonSize="sm"
                            listOptionSize="sm"
                            disabled={disabled}
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
                    disabled={disabled}
                    data-testid="equipment-manufacturer-input"
                    label="Fabricante"
                />

                <Input
                    {...register("model")}
                    type="text"
                    errorMessage={errors.model?.message}
                    placeholder="Digite o nome do modelo"
                    disabled={disabled}
                    data-testid="equipment-model-input"
                    label="Modelo"
                />

                <Input
                    {...register("series_number")}
                    type="text"
                    errorMessage={errors.series_number?.message}
                    placeholder="Digite o número de série, se houver"
                    disabled={disabled}
                    data-testid="equipment-series-number-input"
                    label="Número de série"
                />

                <Input
                    {...register("anvisa_registry")}
                    type="text"
                    errorMessage={errors.anvisa_registry?.message}
                    placeholder="Digite o registro na ANVISA, se houver"
                    disabled={disabled}
                    data-testid="equipment-anvisa-registry-input"
                    label="Registro na ANVISA"
                />

                <div className="flex flex-col gap-4">
                    <Typography element="p" size="sm" className="font-medium">
                        Foto do equipamento
                    </Typography>

                    {!disabled && (
                        <Input
                            {...register("equipment_photo")}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            errorMessage={errors.equipment_photo?.message}
                            data-testid="equipment-photo-input"
                        />
                    )}

                    {equipment.equipment_photo && (
                        <ViewImageButton
                            imageEndpoint={equipment.equipment_photo}
                            imageTitle="Foto do equipamento"
                        />
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    <Typography element="p" size="sm" className="font-medium">
                        Foto do rótulo do equipamento
                    </Typography>

                    {!disabled && (
                        <Input
                            {...register("label_photo")}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            errorMessage={errors.label_photo?.message}
                            disabled={disabled}
                            data-testid="equipment-label-input"
                        />
                    )}

                    {equipment.label_photo && (
                        <ViewImageButton
                            imageEndpoint={equipment.label_photo}
                            imageTitle="Foto do rótulo do equipamento"
                        />
                    )}
                </div>

                {!reviewMode &&
                    !disabled &&
                    !needReview &&
                    (userData?.role === Role.FMI || userData?.role === Role.GP) && (
                        <div className="flex flex-col gap-2 mt-6 border-t pt-4">
                            <Typography element="h3" size="title3" className="font-semibold mb-4">
                                Informações adicionais do equipamento
                            </Typography>

                            <Input
                                {...register("channels")}
                                type="text"
                                errorMessage={errors.channels?.message}
                                placeholder="Digite o número de canais"
                                disabled={disabled}
                                data-testid="equipment-channels-input"
                                label="Canais"
                            />

                            <Input
                                {...register("official_max_load")}
                                type="number"
                                errorMessage={errors.official_max_load?.message}
                                placeholder="Digite a carga máxima oficial"
                                disabled={disabled}
                                data-testid="equipment-official-max-load-input"
                                label="Carga máxima oficial"
                            />

                            <Input
                                {...register("usual_max_load")}
                                type="number"
                                errorMessage={errors.usual_max_load?.message}
                                placeholder="Digite a carga máxima usual"
                                disabled={disabled}
                                data-testid="equipment-usual-max-load-input"
                                label="Carga máxima usual"
                            />

                            <Input
                                {...register("purchase_installation_date")}
                                type="date"
                                errorMessage={errors.purchase_installation_date?.message}
                                disabled={disabled}
                                data-testid="equipment-purchase-installation-date-input"
                                label="Data de instalação da compra"
                            />

                            <Input
                                {...register("maintenance_responsable")}
                                type="text"
                                errorMessage={errors.maintenance_responsable?.message}
                                placeholder="Digite o nome do responsável pela manutenção"
                                disabled={disabled}
                                data-testid="equipment-maintenance-responsable-input"
                                label="Responsável pela manutenção"
                            />

                            <Input
                                {...register("email_maintenance_responsable")}
                                type="email"
                                errorMessage={errors.email_maintenance_responsable?.message}
                                placeholder="Digite o e-mail do responsável pela manutenção"
                                disabled={disabled}
                                data-testid="equipment-email-maintenance-responsable-input"
                                label="E-mail do responsável pela manutenção"
                            />

                            <Input
                                {...register("phone_maintenance_responsable")}
                                type="text"
                                errorMessage={errors.phone_maintenance_responsable?.message}
                                placeholder="Digite o telefone do responsável pela manutenção"
                                disabled={disabled}
                                data-testid="equipment-phone-maintenance-responsable-input"
                                label="Telefone do responsável pela manutenção"
                            />
                        </div>
                    )}
            </>
        );
    };

    const renderAccessoryInputs = (accessoryIndex: number) => {
        return (
            <div key={accessoryIndex} className="flex flex-col gap-4">
                <div className="flex justify-between gap-24 items-center">
                    <Typography element="h3" className="font-semibold">
                        {displaySingularAccessoryType(accessoryType!)}&nbsp;{accessoryIndex + 1}
                    </Typography>

                    {!disabled && (
                        <Button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleRemoveAccessory(accessoryIndex)}
                            variant="secondary"
                            data-testid="cancel-btn"
                            className="w-full"
                        >
                            Remover este acessório
                        </Button>
                    )}
                </div>

                <Input
                    {...register(`accessories.${accessoryIndex}.manufacturer`)}
                    type="text"
                    errorMessage={errors.accessories?.[accessoryIndex]?.manufacturer?.message}
                    placeholder="Digite o nome do fabricante"
                    disabled={disabled}
                    data-testid="accessory-manufacturer-input"
                    label="Fabricante"
                />

                <Input
                    {...register(`accessories.${accessoryIndex}.model`)}
                    type="text"
                    errorMessage={errors.accessories?.[accessoryIndex]?.model?.message}
                    placeholder="Digite o nome do modelo"
                    disabled={disabled}
                    data-testid="equipment-model-input"
                    label="Modelo"
                />

                <Input
                    {...register(`accessories.${accessoryIndex}.series_number`)}
                    type="text"
                    errorMessage={errors.accessories?.[accessoryIndex]?.series_number?.message}
                    placeholder="Digite o número de série, se houver"
                    disabled={disabled}
                    data-testid="equipment-series-number-input"
                    label="Número de série"
                />

                <Typography element="p" size="sm" className="font-medium">
                    Foto do equipamento
                </Typography>
                <div className="flex flex-col gap-4">
                    {!disabled && (
                        <Input
                            {...register(`accessories.${accessoryIndex}.equipment_photo`)}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            errorMessage={
                                errors.accessories?.[accessoryIndex]?.equipment_photo?.message
                            }
                            disabled={disabled}
                            data-testid="equipment-photo-input"
                        />
                    )}

                    {filteredAccessories[accessoryIndex]?.equipment_photo && (
                        <ViewImageButton
                            imageEndpoint={filteredAccessories[accessoryIndex].equipment_photo}
                            imageTitle={`Foto do acessório ${filteredAccessories[accessoryIndex].model}`}
                        />
                    )}
                </div>

                <Typography element="p" size="sm" className="font-medium">
                    Foto do rótulo do equipamento
                </Typography>
                <div className="flex flex-col gap-4">
                    {!disabled && (
                        <Input
                            {...register(`accessories.${accessoryIndex}.label_photo`)}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            errorMessage={
                                errors.accessories?.[accessoryIndex]?.label_photo?.message
                            }
                            disabled={disabled}
                            data-testid="equipment-label-input"
                        />
                    )}

                    {filteredAccessories[accessoryIndex]?.label_photo && (
                        <ViewImageButton
                            imageEndpoint={filteredAccessories[accessoryIndex].label_photo}
                            imageTitle={`Foto do rótulo do acessório ${accessoryIndex + 1}`}
                        />
                    )}
                </div>
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
                    {!isRejected && (
                        <Button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleAddAccessory}
                            variant="secondary"
                            data-testid="accessories-btn"
                            className="w-full"
                        >
                            Acessórios
                        </Button>
                    )}

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

        if (disabled) {
            return (
                <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setEditAccessories(false)}
                    variant="primary"
                    data-testid="cancel-btn"
                    className="w-full"
                >
                    Voltar
                </Button>
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
                            manufacturer: "",
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

    const ImageViewModal = () => (
        <Modal
            isOpen={imageModalOpen}
            onClose={() => setImageModalOpen(false)}
            className="sm:max-w-4xl"
        >
            <div className="relative">
                <button
                    onClick={() => setImageModalOpen(false)}
                    className="absolute right-2 top-2 p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full transition-colors z-10 shadow-lg"
                    data-testid="btn-close-modal"
                    aria-label="Fechar modal"
                >
                    <XCircle size={24} className="text-primary" />
                </button>

                <Image
                    src={currentImageUrl}
                    alt={currentImageTitle}
                    width={800}
                    height={600}
                    className="w-full h-full object-contain"
                />
            </div>
        </Modal>
    );

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
            if (!needReview && removedAccessoryIds.length > 0) {
                const deletionPromises = removedAccessoryIds.map((id) => deleteAccessory(id));
                const deletionResults = await Promise.all(deletionPromises);

                const deletionErrors = deletionResults.filter((result) => "error" in result);
                if (deletionErrors.length > 0) {
                    console.error("Errors deleting accessories:", deletionErrors);
                    toast.error("Erro ao remover um ou mais acessórios. Tente novamente.");
                    setRemovedAccessoryIds([]);
                    return;
                }
                setRemovedAccessoryIds([]);
            }

            const equipmentResponse = needReview
                ? await createEditEquipmentOperation(equipmentFormData)
                : await editEquipment({
                      equipmentID: equipment.id,
                      equipmentData: equipmentFormData,
                  });

            if (equipmentResponse.error) {
                throw new Error(
                    `Error creating equipment: ${JSON.stringify(equipmentResponse.error)}`
                );
            }

            // The backend will handle accessories when reviewMode is true
            if (!reviewMode) {
                await handleAccessories(accessoriesFormData, equipmentResponse.data);
            }

            // If review is not required, the user is either an internal medical physicist or a Prophy manager.
            // The user may be editing data or reviewing an operation.
            // If `isRejected` is false, the user accepted the operation or updated some data.
            let successMessage = "Requisição enviada com sucesso!";
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
                manufacturer: accessory.manufacturer,
                series_number: accessory.series_number,
                equipment_photo: null,
                label_photo: null,
                original_equipment_photo: accessory.equipment_photo || undefined,
                original_label_photo: accessory.label_photo || undefined,
            }))
        );
    }, [filteredAccessories, isLoadingAccessories, setValue]);

    // Filter accessories by equipment ID
    useEffect(() => {
        if (!accessories || isLoadingAccessories) {
            return;
        }
        setFilteredAccessories(
            accessories.filter((accessory) => accessory.equipment === equipment.id)
        );
    }, [accessories, isLoadingAccessories, equipment.id]);

    // Fetch equipment photos from the server
    useEffect(() => {
        if (equipment.equipment_photo) {
            try {
                handleEquipmentPhotoFetch(equipment.equipment_photo, false);
            } catch (error) {
                toast.error("Erro ao carregar a foto do equipamento.");
            }
        }

        if (equipment.label_photo) {
            try {
                handleEquipmentPhotoFetch(equipment.label_photo, true);
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
                {!isRejected ? (
                    <>
                        <Typography element="h3" size="title3" className="font-semibold">
                            {title}
                        </Typography>
                        <Typography element="p" size="md" className="text-justify">
                            {description}
                        </Typography>
                    </>
                ) : (
                    <Typography element="h3" size="title3" className="font-semibold">
                        Por favor, justifique o motivo da rejeição
                    </Typography>
                )}

                {!editAccessories && renderEquipmentInputs()}

                {editAccessories && fields.map((_, index) => renderAccessoryInputs(index))}

                {editAccessories && fields.length === 0 && (
                    <Typography element="p" className="font-semibold">
                        Nenhum acessório adicionado. Clique em "Adicionar um{" "}
                        {displaySingularAccessoryType(accessoryType!)}" para adicionar um acessório.
                    </Typography>
                )}

                <div className="flex flex-col gap-2">
                    {fields.length > 0 && !editAccessories && !isRejected && (
                        <Typography element="p" className="font-semibold">
                            Acessórios:
                        </Typography>
                    )}
                    {fields.length > 0 &&
                        !editAccessories &&
                        !isRejected &&
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
                </div>
                {renderButtons()}
            </Form>
            <ImageViewModal />
        </div>
    );
};

export default EditEquipmentForm;
