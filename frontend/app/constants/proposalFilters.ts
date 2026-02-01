import { SelectData } from "@/components/forms/Select";

import {
    CONTRACT_TYPE_MAP,
    CONTRACT_TYPE_OPTIONS,
    getContractTypeFromOptionId,
    getContractTypeOptionIdFromValue,
} from "./contract";

export {
    CONTRACT_TYPE_MAP,
    CONTRACT_TYPE_OPTIONS,
    getContractTypeFromOptionId,
    getContractTypeOptionIdFromValue,
};

export const PROPOSAL_STATUS_OPTIONS: SelectData[] = [
    { id: 0, value: "Todos" },
    { id: 1, value: "Aceito" },
    { id: 2, value: "Rejeitado" },
    { id: 3, value: "Pendente" },
];

export const PROPOSAL_STATUS_MAP: { [key: number]: string } = {
    1: "A",
    2: "R",
    3: "P",
};

export const getProposalStatusFromOptionId = (optionId: number): string => {
    return PROPOSAL_STATUS_MAP[optionId] || "";
};

export const getProposalStatusOptionIdFromValue = (value: string | null): number => {
    if (!value) return 0;
    const entry = Object.entries(PROPOSAL_STATUS_MAP).find(([, v]) => v === value);
    return entry ? parseInt(entry[0], 10) : 0;
};
