import { z } from "zod";
import { isValidPhonePTBR } from "@/utils/validation";

const base = z.object({
    date: z
        .string()
        .optional()
        .transform((value) => (value === "" ? undefined : value))
        .refine((value) => value === undefined || !Number.isNaN(Date.parse(value)), {
            message: "Data inválida.",
        }),
    contact_name: z
        .string()
        .min(1, { message: "Nome do contato é obrigatório." })
        .max(50, { message: "Nome do contato deve ter no máximo 50 caracteres." })
        .transform((value) => value?.trim()),
    contact_phone: z
        .string()
        .refine((value) => isValidPhonePTBR(value), {
            message: "Telefone inválido.",
        })
        .transform((value) => value?.trim()),
    justification: z
        .string()
        .optional()
        .transform((value) => value?.trim()),
});

export const makeVisitScheduleSchema = (opts?: { requireJustification?: boolean }) =>
    base.superRefine((data, ctx) => {
        if (opts?.requireJustification) {
            if (!data.justification || data.justification.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["justification"],
                    message: "Justificativa é obrigatória.",
                });
            }
        }
    });

const visitScheduleSchema = makeVisitScheduleSchema();

export default visitScheduleSchema;
