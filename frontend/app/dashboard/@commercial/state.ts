import { CLIENT_STATUS_MAP } from "./constants";
import {
    getAppointmentStatusClasses,
    getAppointmentStatusFromOptionId,
    getAppointmentStatusOptionIdFromValue,
} from "@/constants/appointmentStatus";

export {
    resetPageState,
    restoreTextFilterStates,
    restoreSelectFilterStates,
} from "@/utils/filter-restoration";

export const getClientStatusFromOptionId = (optionId: number): string => {
    return CLIENT_STATUS_MAP[optionId] || "";
};

export const getClientIsActiveFromOptionId = (optionId: number): string => {
    return CLIENT_STATUS_MAP[optionId] || "";
};

export { getContractTypeFromOptionId } from "@/constants/contract";
export { getProposalStatusFromOptionId } from "@/constants/proposalFilters";

export const getClientStatusOptionIdFromValue = (value: string | null | undefined): number => {
    if (!value) return 0;
    const entry = Object.entries(CLIENT_STATUS_MAP).find(([_, v]) => v === value);
    return entry ? parseInt(entry[0], 10) : 0;
};

export { getContractTypeOptionIdFromValue } from "@/constants/contract";
export { getProposalStatusOptionIdFromValue } from "@/constants/proposalFilters";

export {
    getAppointmentStatusClasses,
    getAppointmentStatusFromOptionId,
    getAppointmentStatusOptionIdFromValue,
};
