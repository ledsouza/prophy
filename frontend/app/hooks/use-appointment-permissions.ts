import Role from "@/enums/Role";
import type { AppointmentDTO } from "@/types/appointment";
import {
    can,
    shouldShow,
    isMarkDoneDisabled as _isMarkDoneDisabled,
    isRescheduleDisabled as _isRescheduleDisabled,
} from "@/utils/permissions/appointment";

/**
 * Bundles appointment permissions and UI visibility booleans.
 * Centralizes role checks and status-gated visibility for the AppointmentCard.
 */
export function useAppointmentPermissions(appointment: AppointmentDTO, role?: Role) {
    return {
        canDeleteAppointment: can("deleteAppointment", role),
        canRescheduleAppointment: can("rescheduleAppointment", role),
        canScheduleAppointment: can("scheduleAppointment", role),
        canUpdateServiceOrder: can("updateServiceOrder", role),
        canViewServiceOrder: can("viewServiceOrder", role),
        canEditUpdates: can("editUpdates", role),

        showCreateServiceOrderButton: shouldShow("createServiceOrder", appointment, role),
        showConfirmAppointmentButton: shouldShow("confirmAppointment", appointment, role),
        showRescheduleButton: shouldShow("rescheduleAppointment", appointment, role),
        showJustifyButton: shouldShow("justifyAppointment", appointment, role),
        showJustificationViewerButton: shouldShow("justificationViewer", appointment, role),

        isRescheduleDisabled: _isRescheduleDisabled(appointment),
        isMarkDoneDisabled: _isMarkDoneDisabled(appointment),
    };
}
