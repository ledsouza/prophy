import { AccessoryType } from "@/redux/features/modalityApiSlice";

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
