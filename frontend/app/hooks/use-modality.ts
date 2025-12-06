import { SelectData } from "@/components/forms/Select";
import {
    AccessoryType,
    ModalityDTO,
    useListModalitiesQuery,
} from "@/redux/features/modalityApiSlice";
import { useEffect, useState } from "react";

/**
 * A custom hook for managing modality selection and related state in forms.
 *
 * @param setValue - Function to set the modality value in the form
 * @param defaultModality - Optional default modality to pre-select
 *
 * @returns An object containing:
 * - modalities: Array of available modalities
 * - modalityOptions: Formatted array of modalities for select component
 * - selectedModality: Currently selected modality
 * - setSelectedModality: Function to update selected modality
 * - accessoryType: Accessory type of the selected modality
 * - isLoadingModalities: Loading state for modalities fetch
 * - isErrorModalities: Error state for modalities fetch
 *
 * @example
 * ```typescript
 * const {
 *   modalityOptions,
 *   selectedModality,
 *   setSelectedModality
 * } = useModality(setValue);
 * ```
 */
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
    }, [modalities, defaultModality]);

    // Set the value for the modality field when the modalities are loaded
    // and when the selected modality changes
    // Also set the accessory type based on the selected modality
    useEffect(() => {
        if (selectedModality) {
            setValue("modality", selectedModality.id);

            const modality = modalities?.find((modality) => modality.id === selectedModality.id);
            setAccessoryType(modality?.accessory_type);
        }
    }, [selectedModality, modalities, setValue]);

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
