/**
 Read vs write models:
 - VisitDTO: read (API output).
 - Payloads: write (client input).
 Keeps immutable/server-managed fields (id, unit, service_order) out of
 writes and allows different create vs update shapes.
*/
import type { ServiceOrderDTO } from "@/redux/features/serviceOrderApiSlice";
import type { ListQueryParams } from "@/redux/services/apiSlice";
import VisitStatus from "@/enums/VisitStatus";

/**
 * Visit entity as returned by the backend API.
 */
export type VisitDTO = {
    id: number;
    date: string; // ISO 8601 datetime
    status: VisitStatus;
    justification?: string | null;
    contact_phone: string;
    contact_name: string;
    service_order?: ServiceOrderDTO | null;
    unit: number;
};

/**
 * Query args for listing visits (read model).
 */
export type ListVisitsArgs = ListQueryParams & {
    unit?: number;
};

/**
 * Editable fields only (write model). Not derived from VisitDTO
 * to avoid server-managed fields and to keep write constraints
 * independent.
 */
export type VisitBase = {
    date: string; // ISO 8601 datetime
    contact_name: string;
    contact_phone: string;
    status?: VisitStatus;
    justification?: string | null;
};

export type CreateVisitPayload = VisitBase & {
    unit: number;
};

export type UpdateVisitPayload = Partial<
    Pick<VisitBase, "date" | "contact_name" | "contact_phone" | "status" | "justification">
>;
