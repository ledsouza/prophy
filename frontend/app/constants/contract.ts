import { SelectData } from "@/components/forms/Select";

export const CONTRACT_TYPE_OPTIONS: SelectData[] = [
    { id: 0, value: "Todos" },
    { id: 1, value: "Anual" },
    { id: 2, value: "Mensal" },
    { id: 3, value: "Semanal" },
];

export const CONTRACT_TYPE_MAP: { [key: number]: string } = {
    1: "A",
    2: "M",
    3: "W",
};

export const getContractTypeFromOptionId = (optionId: number): string => {
    return CONTRACT_TYPE_MAP[optionId] || "";
};

export const getContractTypeOptionIdFromValue = (value: string | null | undefined): number => {
    if (!value) return 0;
    const entry = Object.entries(CONTRACT_TYPE_MAP).find(([, v]) => v === value);
    return entry ? parseInt(entry[0], 10) : 0;
};
