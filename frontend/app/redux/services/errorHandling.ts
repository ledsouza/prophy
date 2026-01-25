// Type for RTK Query error responses with messages
interface ErrorWithMessages {
    data: {
        messages?: string[];
        message?: string;
        detail?: string;
        [key: string]: unknown;
    };
    status?: number;
}

type ErrorWithFieldErrors = {
    data: Record<string, unknown>;
    status?: number;
};

function hasFieldErrors(error: unknown): error is ErrorWithFieldErrors {
    return (
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof (error as any).data === "object" &&
        (error as any).data !== null
    );
}

function getFieldErrorMessage(error: unknown): string | null {
    if (!hasFieldErrors(error)) {
        return null;
    }

    const data = (error as ErrorWithFieldErrors).data;

    const ignoreKeys = new Set(["message", "messages", "detail"]);
    for (const [field, value] of Object.entries(data)) {
        if (ignoreKeys.has(field)) {
            continue;
        }

        if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
            return value[0];
        }

        if (typeof value === "string") {
            return value;
        }
    }

    return null;
}

// Check if error has messages array
export function hasErrorMessages(error: unknown): error is ErrorWithMessages {
    return (
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof (error as any).data === "object" &&
        ((Array.isArray((error as any).data.messages) && (error as any).data.messages.length > 0) ||
            typeof (error as any).data.message === "string" ||
            typeof (error as any).data.detail === "string")
    );
}

// Extract the first error message from various error formats
export function getErrorMessage(error: unknown): string {
    // Case 1: Error with messages array
    if (
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof (error as any).data === "object" &&
        Array.isArray((error as any).data.messages) &&
        (error as any).data.messages.length > 0
    ) {
        return (error as any).data.messages[0];
    }

    // Case 2: Error with single message
    if (
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof (error as any).data === "object" &&
        typeof (error as any).data.message === "string"
    ) {
        return (error as any).data.message;
    }

    // Case 3: Error with detail (common in DRF)
    if (
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof (error as any).data === "object" &&
        typeof (error as any).data.detail === "string"
    ) {
        return (error as any).data.detail;
    }

    // Case 4: Standard Error object
    if (error instanceof Error) {
        return error.message;
    }

    // Case 5: Unknown error format
    return "Um erro inesperado ocorreu. Tente novamente mais tarde.";
}

// Get HTTP status code from error if available
export function getErrorStatus(error: unknown): number | null {
    if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        typeof (error as any).status === "number"
    ) {
        return (error as any).status;
    }
    return null;
}

// Get appropriate error message based on status code
export function getStatusErrorMessage(status: number): string {
    switch (status) {
        case 400:
            return "Dados inválidos. Verifique as informações e tente novamente.";
        case 401:
            return "Não autorizado. Faça login novamente.";
        case 403:
            return "Você não tem permissão para realizar esta ação.";
        case 404:
            return "Recurso não encontrado.";
        case 409:
            return "Conflito de dados. Este recurso já existe ou está em uso.";
        case 422:
            return "Dados inválidos. Verifique as informações e tente novamente.";
        case 429:
            return "Muitas requisições. Aguarde um momento e tente novamente.";
        case 500:
        case 502:
        case 503:
        case 504:
            return "Erro no servidor. Tente novamente mais tarde.";
        default:
            return `Erro ${status}. Tente novamente mais tarde.`;
    }
}

import { toast } from "react-toastify";

/**
 * Handles API errors by displaying a toast notification and logging the error.
 * @param error The error object caught from an API call.
 * @param contextMessage An optional message to provide context for the console log.
 */
export function handleApiError(error: unknown, contextMessage: string = "API Error"): void {
    const status = getErrorStatus(error);

    if (status === 400 || status === 409 || status === 422) {
        console.warn(contextMessage + ":", error);
    } else {
        console.error(contextMessage + ":", error);
    }

    if (status === 400 || status === 409 || status === 422) {
        const fieldMessage = getFieldErrorMessage(error);
        if (fieldMessage) {
            toast.error(fieldMessage);
            return;
        }

        const extracted = getErrorMessage(error);
        if (extracted) {
            toast.error(extracted);
            return;
        }
    }

    if (status) {
        toast.error(getStatusErrorMessage(status));
    } else {
        toast.error(getErrorMessage(error));
    }
}
