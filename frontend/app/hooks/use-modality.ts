import { useState, useEffect } from "react";
import {
    AccessoryType,
    ModalityDTO,
    useListModalitiesQuery,
} from "@/redux/features/modalityApiSlice";
import { SelectData } from "@/components/forms/Select";

export const useModality = (
    setValue: (name: "modality", value: number) => void,
    defaultModality?: ModalityDTO
) => {
    const {
        data: modalities,
        isLoading: isLoadingModalities,
        isError: isErrorModalities,
    } = useListModalitiesQuery();

    const [modalityOptions, setModalityOptions] = useState<SelectData[]>();
    const [selectedModality, setSelectedModality] = useState<SelectData>();
    const [accessoryType, setAccessoryType] = useState<AccessoryType>();

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
                id: defaultModality?.id || modalities[0].id,
                value: defaultModality?.name || modalities[0].name,
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
            setAccessoryType(modality?.accessory_type);
        }
    }, [selectedModality]);

    return {
        modalities,
        modalityOptions,
        selectedModality,
        setSelectedModality,
        accessoryType,
        isLoadingModalities,
        isErrorModalities,
    };
};
