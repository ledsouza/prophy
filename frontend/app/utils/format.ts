import { AccessoryType } from "@/redux/features/modalityApiSlice";
import { ContractType, ProposalStatus } from "@/enums";

export function formatPhoneNumber(phone?: string): string | undefined {
    if (!phone) return undefined;

    if (phone.length === 11) {
        return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)} - ${phone.slice(7)}`;
    } else if (phone.length === 10) {
        return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)} - ${phone.slice(6)}`;
    } else {
        return "Número de telefone inválido";
    }
}

export const displaySingularAccessoryType = (type: AccessoryType) => {
    switch (type) {
        case AccessoryType.DETECTOR:
            return "Detector";
        case AccessoryType.COIL:
            return "Bobina";
        case AccessoryType.TRANSDUCER:
            return "Transdutor";
        default:
            throw new Error("Tipo de acessório inválido.");
    }
};

export const displayPluralAccessoryType = (type: AccessoryType) => {
    switch (type) {
        case AccessoryType.DETECTOR:
            return "Detectores";
        case AccessoryType.COIL:
            return "Bobinas";
        case AccessoryType.TRANSDUCER:
            return "Transdutores";
        default:
            throw new Error("Tipo de acessório inválido.");
    }
};

export const getStatusDisplay = (status: string) => {
    // Handle client statuses (boolean strings)
    if (status === "true") {
        return { text: "Ativo", color: "text-success bg-success/10" };
    }
    if (status === "false") {
        return { text: "Inativo", color: "text-danger bg-danger/10" };
    }

    // Handle proposal statuses
    switch (status) {
        case ProposalStatus.ACCEPTED:
            return { text: "Aceito", color: "text-success bg-success/10" };
        case ProposalStatus.REJECTED:
            return { text: "Rejeitado", color: "text-danger bg-danger/10" };
        case ProposalStatus.PENDING:
            return { text: "Pendente", color: "text-warning bg-warning/10" };
        default:
            return { text: "Desconhecido", color: "text-gray-secondary bg-gray-100" };
    }
};

export const getContractTypeDisplay = (contractType: string) => {
    switch (contractType) {
        case ContractType.ANNUAL:
            return "Anual";
        case ContractType.MONTHLY:
            return "Mensal";
        case ContractType.WEEKLY:
            return "Semanal";
        default:
            return contractType;
    }
};

export const formatCurrency = (value: string): string => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return "R$ 0,00";

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(numericValue);
};

export const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch {
        return dateString;
    }
};

export const formatDateTime = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return dateString;
    }
};
