import { z } from "zod";
import { isCPF } from "validation-br";

const unitManagerSchema = z.object({
    name: z.string().nonempty({ message: "Nome é obrigatório." }),
    cpf: z.string().length(11, { message: "O CPF deve conter 11 caracteres." }).refine(isCPF, {
        message:
            "CPF inválido. Certifique-se de que você digitou todos os 11 dígitos corretamente.",
    }),
    email: z.string().email({ message: "E-mail do contato inválido." }),
    phone: z
        .string()
        .length(11, {
            message: "O número de celular deve estar no padrão de 11 dígitos (DD9XXXXXXXX).",
        })
        .refine((value) => /^\d{2}9\d{8}$/.test(value), {
            message: "O número de celular deve estar no padrão de 11 dígitos (DD9XXXXXXXX).",
        }),
});

export default unitManagerSchema;
