import { SelectData } from "@/components/forms/Select";

export const USER_ROLE_OPTIONS: SelectData[] = [
    { id: 0, value: "Todos" },
    { id: 1, value: "Físico Médico Interno" },
    { id: 2, value: "Físico Médico Externo" },
    { id: 3, value: "Gerente Prophy" },
    { id: 4, value: "Gerente Geral de Cliente" },
    { id: 5, value: "Gerente de Unidade" },
    { id: 6, value: "Comercial" },
];

export const CONTRACT_TYPE_OPTIONS: SelectData[] = [
    { id: 0, value: "Todos" },
    { id: 1, value: "Anual" },
    { id: 2, value: "Mensal" },
    { id: 3, value: "Semanal" },
];

export const OPERATION_STATUS_OPTIONS: SelectData[] = [
    { id: 0, value: "Todos" },
    { id: 1, value: "Com Operações Pendentes" },
    { id: 2, value: "Sem Operações Pendentes" },
];

export const USER_ROLE_MAP: { [key: number]: string } = {
    1: "FMI",
    2: "FME",
    3: "GP",
    4: "GGC",
    5: "GU",
    6: "C",
};

export const CONTRACT_TYPE_MAP: { [key: number]: string } = {
    1: "A",
    2: "M",
    3: "W",
};

export const OPERATION_STATUS_MAP: { [key: number]: string } = {
    1: "pending",
    2: "none",
};
