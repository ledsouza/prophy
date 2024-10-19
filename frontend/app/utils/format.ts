export function formatPhoneNumber(phone?: string): string | undefined {
    if (!phone) return undefined;

    if (phone.length === 11) {
        return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)} - ${phone.slice(
            7
        )}`;
    } else if (phone.length === 10) {
        return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)} - ${phone.slice(
            6
        )}`;
    } else {
        return "Número de telefone inválido";
    }
}
