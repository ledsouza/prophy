import { SelectData } from "@/components/forms/Select";
import { APPOINTMENT_STATUS_MAP, APPOINTMENT_STATUS_OPTIONS } from "@/constants/appointmentStatus";
import { CONTRACT_TYPE_MAP, CONTRACT_TYPE_OPTIONS } from "@/constants/contract";
import { PROPOSAL_STATUS_MAP, PROPOSAL_STATUS_OPTIONS } from "@/constants/proposalFilters";

export const CLIENT_STATUS_OPTIONS: SelectData[] = [
    { id: 0, value: "Todos" },
    { id: 1, value: "Ativo" },
    { id: 2, value: "Inativo" },
];

export const CLIENT_STATUS_MAP: { [key: number]: string } = {
    1: "true",
    2: "false",
};

export {
    APPOINTMENT_STATUS_MAP,
    APPOINTMENT_STATUS_OPTIONS,
    CONTRACT_TYPE_MAP,
    CONTRACT_TYPE_OPTIONS,
    PROPOSAL_STATUS_MAP,
    PROPOSAL_STATUS_OPTIONS,
};
