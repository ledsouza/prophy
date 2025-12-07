/**
 Read vs write models:
 - AppointmentDTO: read (API output).
 - Payloads: write (client input).
 Keeps immutable/server-managed fields (id, unit, service_order) out of
 writes and allows different create vs update shapes.
*/
import type { ServiceOrderDTO } from "@/types/service-order";
import type { ListQueryParams } from "@/redux/services/apiSlice";
import AppointmentStatus from "@/enums/AppointmentStatus";
import AppointmentType from "@/enums/AppointmentType";

/**
 * Appointment entity as returned by the backend API.
 */
export type AppointmentDTO = {
    id: number;
    date: string; // ISO 8601 datetime
    status: AppointmentStatus;
    type: AppointmentType;
    justification?: string | null;
    contact_phone: string;
    contact_name: string;
    service_order?: ServiceOrderDTO | null;
    unit: number;
    unit_name?: string;
    client_name?: string;
    unit_full_address?: string;
    type_display?: string;
};

/**
 * Query args for listing appointments (read model).
 */
export type ListAppointmentsArgs = ListQueryParams & {
    unit?: number;
};

/**
 * Editable fields only (write model). Not derived from AppointmentDTO
 * to avoid server-managed fields and to keep write constraints
 * independent.
 */
export type AppointmentBase = {
    date: string; // ISO 8601 datetime
    contact_name: string;
    contact_phone: string;
    type: AppointmentType;
    status?: AppointmentStatus;
    justification?: string | null;
};

export type CreateAppointmentPayload = AppointmentBase & {
    unit: number;
};

export type UpdateAppointmentPayload = Partial<
    Pick<
        AppointmentBase,
        "date" | "contact_name" | "contact_phone" | "type" | "status" | "justification"
    >
>;
