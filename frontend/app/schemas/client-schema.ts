import { z } from "zod";
import { isValidPhonePTBR } from "@/utils/validation";

const clientSchema = z.object({
    name: z
        .string()
        .min(1, { message: "Nome da instituição é obrigatório." })
        .max(50, {
            message: "Nome da instituição não pode exceder 50 caracteres.",
        }),
    email: z.string().email({ message: "E-mail da instituição inválido." }),
    phone: z.string().refine((value) => isValidPhonePTBR(value), {
        message: "Telefone inválido.",
    }),
    address: z
        .string()
        .min(1, { message: "Endereço da instituição é obrigatório." }),
    state: z
        .string()
        .min(1, { message: "Estado da instituição é obrigatório." }),
    city: z
        .string()
        .min(1, { message: "Cidade da instituição é obrigatória." }),
    note: z
        .string()
        .optional()
        .refine((value) => value === undefined || value.trim().length > 0, {
            message: "A justificative é obrigatória.",
        }),
});

export default clientSchema;
