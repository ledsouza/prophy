import { z } from "zod";
import { makeAppointmentScheduleSchema } from "./appointment-schedule-schema";

/**
 * Schema for creating a new appointment from the global commercial dashboard.
 * Extends the base appointment schedule schema with client and unit selection.
 */
const appointmentGlobalCreateSchema = makeAppointmentScheduleSchema().extend({
    client: z.number({
        required_error: "Cliente é obrigatório.",
        invalid_type_error: "Cliente inválido.",
    }),
    unit: z.number({
        required_error: "Unidade é obrigatória.",
        invalid_type_error: "Unidade inválida.",
    }),
});

export default appointmentGlobalCreateSchema;
