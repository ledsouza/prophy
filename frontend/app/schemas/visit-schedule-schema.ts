import { z } from "zod";
import { isValidPhonePTBR } from "@/utils/validation";

const base = z.object({
    date: z
        .string()
        .min(1, { message: "Data é obrigatório." })
        .transform((value) => (value === "" ? undefined : value))
        .refine((value) => value === undefined || !Number.isNaN(Date.parse(value)), {
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
    justification: z
        .string()
        .transform((value) => (value === "" ? undefined : value))
        .optional(),
});

export const makeVisitScheduleSchema = (opts?: { requireJustification?: boolean }) => {
    if (opts?.requireJustification) {
        return base.extend({
            justification: z.string().min(1, { message: "Justificativa é obrigatória." }).trim(),
        });
    }
    return base;
};

const visitScheduleSchema = makeVisitScheduleSchema();

export default visitScheduleSchema;
