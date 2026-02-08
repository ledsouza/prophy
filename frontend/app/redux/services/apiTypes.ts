import { OperationStatus, OperationType } from "@/enums";

export type PaginatedResponse<T> = {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
};

export type ListQueryParams = {
    page?: number;
};

export type Operation = {
    operation_type: OperationType;
    operation_status: OperationStatus;
    note?: string;
};

export type APIDeleteResponse = {
    message: string;
    id: number;
    operation_type: string;
};
