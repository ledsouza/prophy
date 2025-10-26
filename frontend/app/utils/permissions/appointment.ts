import Role from "@/enums/Role";
import AppointmentStatus from "@/enums/AppointmentStatus";
import type { AppointmentDTO } from "@/types/appointment";
import type { ServiceOrderDTO, UpdateServiceOrderPayload } from "@/types/service-order";
import { addDays, startOfDay, isBefore, parseISO } from "date-fns";

export type AppointmentAction =
    | "deleteAppointment"
    | "rescheduleAppointment"
    | "updateServiceOrder"
    | "createServiceOrder"
    | "viewServiceOrder"
    | "confirmAppointment"
    | "justifyAppointment"
    | "editUpdates"
    | "viewJustification"
    | "scheduleAppointment";

const ROLE_PERMISSIONS: Record<AppointmentAction, ReadonlySet<Role>> = {
    deleteAppointment: new Set([Role.GP]),
    scheduleAppointment: new Set([Role.GP, Role.FMI, Role.C]),
    rescheduleAppointment: new Set([Role.GP, Role.FMI, Role.C]),
    updateServiceOrder: new Set([Role.GP]),
    createServiceOrder: new Set([Role.GP, Role.FMI, Role.FME]),
    viewServiceOrder: new Set([Role.GP, Role.FMI, Role.FME, Role.GGC, Role.GU]),
    confirmAppointment: new Set([Role.GP, Role.FMI, Role.FME, Role.C]),
    justifyAppointment: new Set([Role.FMI, Role.FME]),
    editUpdates: new Set([Role.GP, Role.FMI, Role.FME]),
    viewJustification: new Set([Role.GP]),
};

export function can(action: AppointmentAction, role?: Role): boolean {
    return !!role && ROLE_PERMISSIONS[action].has(role);
}

// UI visibility rules that combine permission + appointment status
const SHOW_RULES = {
    createServiceOrder: (a: AppointmentDTO, role?: Role) =>
        can("createServiceOrder", role) && a.status === AppointmentStatus.CONFIRMED,

    confirmAppointment: (a: AppointmentDTO, role?: Role) =>
        can("confirmAppointment", role) &&
        (a.status === AppointmentStatus.PENDING || a.status === AppointmentStatus.RESCHEDULED),

    rescheduleAppointment: (a: AppointmentDTO, role?: Role) =>
        can("rescheduleAppointment", role) && a.status !== AppointmentStatus.UNFULFILLED,

    justifyAppointment: (a: AppointmentDTO, role?: Role) =>
        can("justifyAppointment", role) && a.status === AppointmentStatus.UNFULFILLED,

    justificationViewer: (a: AppointmentDTO, role?: Role) =>
        can("viewJustification", role) &&
        (a.status === AppointmentStatus.UNFULFILLED || a.status === AppointmentStatus.RESCHEDULED),
} as const;

export function shouldShow(
    action: keyof typeof SHOW_RULES,
    appointment: AppointmentDTO,
    role?: Role
): boolean {
    return SHOW_RULES[action](appointment, role);
}

/**
 * Disables the "Reschedule" action when:
 * - appointment.status is UNFULFILLED (must create a brand new appointment)
 * - appointment.status is FULFILLED (already completed)
 * - the reschedule cutoff has passed (current time is on/after the day following scheduled date)
 */
export function isRescheduleDisabled(appointment: AppointmentDTO): boolean {
    if (
        appointment.status === AppointmentStatus.UNFULFILLED ||
        appointment.status === AppointmentStatus.FULFILLED
    ) {
        return true;
    }
    // Keep existing cutoff rule: disable when now >= startOfDay(scheduled + 1 day)
    try {
        const scheduled = parseISO(appointment.date);
        const cutoff = startOfDay(addDays(scheduled, 1));
        return !isBefore(new Date(), cutoff);
    } catch {
        // If date parsing fails, be conservative and do not disable by time
        return false;
    }
}

/**
 * Business rule for disabling the "Mark as done" action:
 *
 * - UNFULFILLED (missed) appointment:
 *   The visit did not happen on the scheduled date/time. The user must create and
 *   schedule a brand new appointment. The current appointment cannot be marked as done
 *   after the fact, because it was missed.
 *
 * - FULFILLED appointment:
 *   The visit has already been completed. Marking it as done again does not make sense
 *   and must remain disabled.
 */
export function isMarkDoneDisabled(appointment: AppointmentDTO): boolean {
    return (
        appointment.status === AppointmentStatus.UNFULFILLED ||
        appointment.status === AppointmentStatus.FULFILLED
    );
}

/**
 * Builds a role-aware payload to update a Service Order (SO).
 *
 * Business rules:
 * - Prophy Manager (Role.GP):
 *   - May update the core SO fields: subject, description, conclusion, equipments.
 *   - The "updates" field is optional and only included when provided AND different from currentUpdates.
 *
 * - Internal/External Medical Physicist and Commercial (Role.FMI, Role.FME, Role.C):
 *   - May update ONLY the "updates" field (string or null to clear).
 *   - If the next value equals currentUpdates, this function returns { skip: true } to avoid a no-op request.
 *
 * - Other roles:
 *   - Not allowed to update any SO field. Returns { deny: true }.
 *
 * Return contract:
 * - payload?: UpdateServiceOrderPayload — shaped payload to send in the PATCH when allowed and necessary.
 * - skip?: boolean — indicates no API call should be made (e.g., unchanged "updates").
 * - deny?: boolean — indicates the current role has no permission to update the SO.
 *
 * Typical usage:
 * ```ts
 * const current = appointment.service_order?.updates ?? null;
 * const result = buildUpdateSOPayloadByRole(role, formData, current);
 * if (result.deny) return toast.info("Sem permissão para atualizar a Ordem de Serviço.");
 * if (result.skip) return toast.info("Sem alterações em Atualizações.");
 * await updateServiceOrder({ id: serviceOrderId, data: result.payload! }).unwrap();
 * toast.success("Ordem de Serviço atualizada com sucesso.");
 * ```
 *
 * Notes:
 * - This is a client-side convenience; the backend must still enforce authorization and field-level rules.
 * - For Role.FMI/FME, "updates" may be set to null to clear the field.
 */
export function buildUpdateSOPayloadByRole(
    role: Role | undefined,
    data: Pick<
        ServiceOrderDTO,
        "subject" | "description" | "conclusion" | "equipments" | "updates"
    >,
    currentUpdates: string | null
): { payload?: UpdateServiceOrderPayload; skip?: boolean; deny?: boolean } {
    if (role === Role.GP) {
        const payload: UpdateServiceOrderPayload = {
            subject: data.subject,
            description: data.description,
            conclusion: data.conclusion,
            equipments: data.equipments || [],
        };
        if (typeof data.updates !== "undefined" && data.updates !== currentUpdates) {
            payload.updates = data.updates;
        }
        return { payload };
    }
    if (role === Role.FMI || role === Role.FME || role === Role.C) {
        const next = data.updates ?? null;
        if (next === currentUpdates) return { skip: true };
        return { payload: { updates: next } };
    }
    return { deny: true };
}
