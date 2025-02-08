import { isValidPhonePTBR } from "@/utils/validation";
import { isCNPJ } from "validation-br";
import { z } from "zod";

const unitSchema = z.object({
    name: z
        .string()
        .nonempty({ message: "Nome é obrigatório." })
        .max(50, { message: "Nome deve ter no máximo 50 caracteres." })
        .transform((value) => value?.trim()),
    cnpj: z
        .string()
        .nonempty({ message: "CNPJ é obrigatório." })
        .refine((cnpj) => isCNPJ(cnpj), { message: "CNPJ inválido." }),
    email: z
        .string()
        .nonempty({ message: "E-mail é obrigatório." })
        .email({ message: "E-mail inválido." }),
    phone: z
        .string()
        .nonempty({ message: "Telefone é obrigatório." })
        .refine((value) => isValidPhonePTBR(value), {
            message: "Telefone inválido.",
        }),
    address: z
        .string()
        .nonempty({ message: "Endereço é obrigatório." })
        .max(150, { message: "Endereço deve ter no máximo 150 caracteres." })
        .transform((value) => value?.trim()),
    state: z
        .string()
        .nonempty({ message: "Estado é obrigatório." })
        .transform((value) => value?.trim()),
    city: z
        .string()
        .nonempty({ message: "Cidade é obrigatória." })
        .transform((value) => value?.trim()),
    note: z
        .string()
        .optional()
        .transform((value) => value?.trim())
        .refine((value) => value === undefined || value.length > 0, {
            message: "A justificative é obrigatória.",
        }),
});

export default unitSchema;
