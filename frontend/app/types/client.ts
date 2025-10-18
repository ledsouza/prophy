/**
 Read vs write models:
 - ClientDTO: read (API output).
 - Payloads: write (client input).
 Keeps immutable/server-managed fields (id, users, status) out of
 writes and allows different create vs update shapes.
*/
import type { UserDTO } from "@/redux/features/authApiSlice";
import type { ListQueryParams, Operation } from "@/redux/services/apiSlice";
import { OperationStatus, OperationType } from "@/enums";

/**
 * Client entity as returned by the backend API.
 */
export type ClientDTO = {
    id: number;
    cnpj: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    state: string;
    city: string;
    status: string;
    users: Pick<UserDTO, "name" | "role" | "email" | "phone">[];
};

/**
 * Client with operation data (for operations endpoints).
 */
export type ClientOperationDTO = ClientDTO &
    Operation & {
        original_client?: number;
    };

/**
 * Query args for listing clients (read model).
 */
export type ListClientsArgs = ListQueryParams & {
    cnpj?: string;
    name?: string;
    city?: string;
    user_role?: string;
    contract_type?: string;
    operation_status?: string;
};

/**
 * Status response type.
 */
export type Status = {
    status: boolean;
};

/**
 * Editable fields only (write model). Not derived from ClientDTO
 * to avoid server-managed fields and to keep write constraints
 * independent.
 */
export type ClientBase = {
    cnpj: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    state: string;
    city: string;
};

export type CreateClientPayload = ClientBase;

export type UpdateClientPayload = Partial<
    Omit<
        ClientOperationDTO,
        "id" | "users" | "status" | "operation_type" | "cnpj" | "note" | "original_client"
    >
>;
