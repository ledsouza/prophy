import { z } from "zod";
import { isValidPhonePTBR } from "@/utils/validation";

const visitScheduleSchema = z.object({
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
});

export default visitScheduleSchema;
