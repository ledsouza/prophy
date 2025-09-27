import type { ServiceOrderDTO } from "@/redux/features/serviceOrderApiSlice";
import VisitStatus from "@/enums/VisitStatus";

/**
 * Visit entity as returned by the backend API.
 * Represents the canonical shape consumed across the app.
 */
export type VisitDTO = {
    id: number;
    date: string; // ISO 8601 datetime from backend
    status: VisitStatus;
    justification?: string | null;
    contact_phone: string;
    contact_name: string;
    service_order?: ServiceOrderDTO | null;
    unit: number;
};

/**
 * Common editable fields for Visit create/update operations.
 * Kept separate to enable precise payload typing.
 */
export type VisitBase = {
    date: string; // ISO 8601 datetime
    contact_name: string;
    contact_phone: string;
    status?: VisitStatus;
    justification?: string | null;
};

/**
 * Payload for creating a new Visit via POST /visits/.
 * Adds the required unit identifier to the base fields.
 */
export type CreateVisitPayload = VisitBase & {
    unit: number;
};

/**
 * Payload for partially updating a Visit via PATCH /visits/:id.
 * Only allows fields that are editable through the API.
 */
export type UpdateVisitPayload = Partial<
    Pick<VisitBase, "date" | "contact_name" | "contact_phone" | "status" | "justification">
>;
