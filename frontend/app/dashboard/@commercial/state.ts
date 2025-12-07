import {
    APPOINTMENT_STATUS_MAP,
    CLIENT_STATUS_MAP,
    CONTRACT_TYPE_MAP,
    PROPOSAL_STATUS_MAP,
} from "./constants";
import AppointmentStatus from "@/enums/AppointmentStatus";

// Re-export shared utilities for convenience
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

export const getAppointmentStatusFromOptionId = (optionId: number): string => {
    return APPOINTMENT_STATUS_MAP[optionId] || "";
};

export const getAppointmentStatusOptionIdFromValue = (value: string | null | undefined): number => {
    if (!value) return 0;
    const entry = Object.entries(APPOINTMENT_STATUS_MAP).find(([_, v]) => v === value);
    return entry ? parseInt(entry[0], 10) : 0;
};

export const getAppointmentStatusClasses = (status: AppointmentStatus): string => {
    switch (status) {
        case AppointmentStatus.PENDING:
            return "bg-warning/10 text-warning";
        case AppointmentStatus.CONFIRMED:
            return "bg-secondary/10 text-secondary";
        case AppointmentStatus.RESCHEDULED:
            return "bg-warning/10 text-warning";
        case AppointmentStatus.FULFILLED:
            return "bg-success/10 text-success";
        case AppointmentStatus.UNFULFILLED:
        default:
            return "bg-danger/10 text-danger";
    }
};
