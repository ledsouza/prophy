import { z } from "zod";
import { makeAppointmentScheduleSchema } from "./appointment-schedule-schema";

/**
 * Schema for creating a new appointment from the global commercial dashboard.
 * Extends the base appointment schedule schema with client and unit selection.
 */
const appointmentGlobalCreateSchema = makeAppointmentScheduleSchema().extend({
    client: z
        .number({ message: "Cliente inválido." })
        .min(1, { message: "Cliente é obrigatório." }),
    unit: z.number({ message: "Unidade inválida." }).min(1, { message: "Unidade é obrigatória." }),
});

export default appointmentGlobalCreateSchema;
