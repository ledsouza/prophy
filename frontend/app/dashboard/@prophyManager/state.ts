import { SelectData } from "@/components/forms/Select";
import { USER_ROLE_MAP, CONTRACT_TYPE_MAP, OPERATION_STATUS_MAP } from "./constants";
import { ModalityDTO } from "@/redux/features/modalityApiSlice";

// Re-export shared utilities for convenience
export {
    resetPageState,
    restoreTextFilterStates,
    restoreSelectFilterStates,
} from "@/utils/filter-restoration";

export const getUserRoleFromOptionId = (optionId: number): string => {
    return USER_ROLE_MAP[optionId] || "";
};

export const getContractTypeFromOptionId = (optionId: number): string => {
    return CONTRACT_TYPE_MAP[optionId] || "";
};

export const getOperationStatusFromOptionId = (optionId: number): string => {
    return OPERATION_STATUS_MAP[optionId] || "";
};

export const getUserRoleOptionIdFromValue = (value: string | null | undefined): number => {
    if (!value) return 0;
    const entry = Object.entries(USER_ROLE_MAP).find(([_, v]) => v === value);
    return entry ? parseInt(entry[0], 10) : 0;
};

export const getContractTypeOptionIdFromValue = (value: string | null | undefined): number => {
    if (!value) return 0;
    const entry = Object.entries(CONTRACT_TYPE_MAP).find(([_, v]) => v === value);
    return entry ? parseInt(entry[0], 10) : 0;
};

export const getOperationStatusOptionIdFromValue = (value: string | null | undefined): number => {
    if (!value) return 0;
    const entry = Object.entries(OPERATION_STATUS_MAP).find(([_, v]) => v === value);
    return entry ? parseInt(entry[0], 10) : 0;
};

export const restoreManufacturerFilterState = (
    equipmentManufacturer: string | null,
    manufacturers: string[],
    setSelectedEquipmentManufacturer: (manufacturer: SelectData) => void
) => {
    if (equipmentManufacturer && manufacturers.length > 0) {
        const manufacturerExists = manufacturers.includes(equipmentManufacturer);
        if (manufacturerExists) {
            setSelectedEquipmentManufacturer({ id: 1, value: equipmentManufacturer });
        }
    }
};

export const restoreModalityFilterState = (
    equipmentModalityId: string | null,
    modalities: ModalityDTO[],
    setSelectedEquipmentModality: (modality: SelectData) => void
) => {
    if (equipmentModalityId && modalities.length > 0) {
        const modality = modalities.find(
            (modality) => modality.id === parseInt(equipmentModalityId, 10)
        );
        if (modality) {
            setSelectedEquipmentModality({ id: modality.id, value: modality.name });
        }
    }
};
