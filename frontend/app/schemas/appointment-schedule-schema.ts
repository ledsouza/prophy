import { z } from "zod";
import { isValidPhonePTBR } from "@/utils/validation";
import AppointmentType from "@/enums/AppointmentType";

const base = z.object({
    date: z
        .string()
        .min(1, { message: "Data é obrigatório." })
        .refine((value) => !Number.isNaN(Date.parse(value)), {
            message: "Data inválida.",
        }),
    contact_name: z
        .string()
        .min(1, { message: "Nome do contato é obrigatório." })
        .max(50, { message: "Nome do contato deve ter no máximo 50 caracteres." })
        .trim(),
    contact_phone: z
        .string()
        .trim()
        .refine((value) => isValidPhonePTBR(value), {
            message: "Telefone inválido.",
        }),
    type: z.nativeEnum(AppointmentType, {
        errorMap: () => ({ message: "Tipo de agendamento é obrigatório." }),
    }),
    justification: z
        .string()
        .transform((value) => (value === "" ? undefined : value))
        .optional(),
});

export const makeAppointmentScheduleSchema = (opts?: { requireJustification?: boolean }) => {
    if (opts?.requireJustification) {
        return base.extend({
            justification: z.string().trim().min(1, { message: "Justificativa é obrigatória." }),
        });
    }
    return base;
};

const appointmentScheduleSchema = makeAppointmentScheduleSchema();

export default appointmentScheduleSchema;
