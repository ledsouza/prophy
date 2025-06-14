import { z } from "zod";
import { isCPF } from "validation-br";

const unitManagerSchema = z.object({
    name: z.string().min(1, { message: "Nome é obrigatório." }),
    cpf: z
        .string()
        .min(1, { message: "CPF é obrigatório." })
        .length(11, { message: "O CPF deve conter 11 caracteres." })
        .refine(isCPF, {
            message:
                "CPF inválido. Certifique-se de que você digitou todos os 11 dígitos corretamente.",
        }),
    email: z
        .string()
        .min(1, { message: "E-mail é obrigatório." })
        .email({ message: "E-mail do contato inválido." }),
    phone: z
        .string()
        .min(1, { message: "O número de celular é obrigatório." })
        .length(11, {
            message: "O número de celular deve estar no padrão de 11 dígitos (DD9XXXXXXXX).",
        })
        .refine((value) => /^\d{2}9\d{8}$/.test(value), {
            message: "O número de celular deve estar no padrão de 11 dígitos (DD9XXXXXXXX).",
        }),
});

export default unitManagerSchema;
