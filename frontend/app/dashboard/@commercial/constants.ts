import { SelectData } from "@/components/forms/Select";

export const CLIENT_STATUS_OPTIONS: SelectData[] = [
    { id: 0, value: "Todos" },
    { id: 1, value: "Ativo" },
    { id: 2, value: "Inativo" },
];

export const CONTRACT_TYPE_OPTIONS: SelectData[] = [
    { id: 0, value: "Todos" },
    { id: 1, value: "Anual" },
    { id: 2, value: "Mensal" },
    { id: 3, value: "Semanal" },
];

export const PROPOSAL_STATUS_OPTIONS: SelectData[] = [
    { id: 0, value: "Todos" },
    { id: 1, value: "Aceito" },
    { id: 2, value: "Rejeitado" },
    { id: 3, value: "Pendente" },
];

export const CLIENT_STATUS_MAP: { [key: number]: string } = {
    1: "true",
    2: "false",
};

export const CONTRACT_TYPE_MAP: { [key: number]: string } = {
    1: "A",
    2: "M",
    3: "W",
};

export const PROPOSAL_STATUS_MAP: { [key: number]: string } = {
    1: "A",
    2: "R",
    3: "P",
};
