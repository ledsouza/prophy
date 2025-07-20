import { SearchTab } from "./enums";
import { SelectData } from "@/components/forms/Select";
import { USER_ROLE_MAP, CONTRACT_TYPE_MAP, OPERATION_STATUS_MAP } from "./constants";
import { getTabFromParam } from "./url";
import { ModalityDTO } from "@/redux/features/modalityApiSlice";

export const restoreTabState = (
    tabParam: string | null,
    setSelectedTabIndex: (index: SearchTab) => void
) => {
    setSelectedTabIndex(getTabFromParam(tabParam));
};

export const restorePageState = (
    pageParam: string | null,
    currentPage: number,
    setCurrentPage: (page: number) => void
) => {
    if (pageParam) {
        const page = parseInt(pageParam, 10);
        if (page > 0 && page !== currentPage) {
            setCurrentPage(page);
        }
    }
};

export const resetPageState = (currentPage: number, setCurrentPage: (page: number) => void) => {
    if (currentPage !== 1) {
        setCurrentPage(1);
    }
};

export const restoreTextFilterStates = (state: string, setState: (state: string) => void) => {
    setState(state);
};

export const restoreSelectFilterStates = (
    id: string | null,
    options: SelectData[],
    setData: (options: SelectData) => void
) => {
    const selectedID = id ? options.find((option) => option.id === Number(id)) : null;
    if (selectedID) setData(selectedID);
};

export const getUserRoleFromOptionId = (optionId: number): string => {
    return USER_ROLE_MAP[optionId] || "";
};

export const getContractTypeFromOptionId = (optionId: number): string => {
    return CONTRACT_TYPE_MAP[optionId] || "";
};

export const getOperationStatusFromOptionId = (optionId: number): string => {
    return OPERATION_STATUS_MAP[optionId] || "";
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
