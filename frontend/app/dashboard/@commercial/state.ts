import { CLIENT_STATUS_MAP, CONTRACT_TYPE_MAP, PROPOSAL_STATUS_MAP } from "./constants";
import ClientStatus from "@/enums/ClientStatus";

// Re-export shared utilities for convenience
export {
    resetPageState,
    restoreTextFilterStates,
    restoreSelectFilterStates,
} from "@/utils/filter-restoration";

export const getClientStatusFromOptionId = (optionId: number): ClientStatus | "" => {
    const value = CLIENT_STATUS_MAP[optionId] || "";
    return value as ClientStatus | "";
};

export const getContractTypeFromOptionId = (optionId: number): string => {
    return CONTRACT_TYPE_MAP[optionId] || "";
};

export const getProposalStatusFromOptionId = (optionId: number): string => {
    return PROPOSAL_STATUS_MAP[optionId] || "";
};

export const getClientStatusOptionIdFromValue = (value: string | null | undefined): number => {
    if (!value) return 0;
    const entry = Object.entries(CLIENT_STATUS_MAP).find(([_, v]) => v === value);
    return entry ? parseInt(entry[0], 10) : 0;
};

export const getContractTypeOptionIdFromValue = (value: string | null | undefined): number => {
    if (!value) return 0;
    const entry = Object.entries(CONTRACT_TYPE_MAP).find(([_, v]) => v === value);
    return entry ? parseInt(entry[0], 10) : 0;
};

export const getProposalStatusOptionIdFromValue = (value: string | null | undefined): number => {
    if (!value) return 0;
    const entry = Object.entries(PROPOSAL_STATUS_MAP).find(([_, v]) => v === value);
    return entry ? parseInt(entry[0], 10) : 0;
};
