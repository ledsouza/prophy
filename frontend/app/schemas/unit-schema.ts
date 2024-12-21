import { isCNPJ } from "validation-br";
import { z } from "zod";

const unitSchema = z.object({
    name: z
        .string()
        .nonempty({ message: "Nome é obrigatório." })
        .max(50, { message: "Nome deve ter no máximo 50 caracteres." }),
    cnpj: z
        .string()
        .nonempty({ message: "CNPJ é obrigatório." })
        .length(14, { message: "CNPJ deve ter 14 caracteres." })
        .refine((cnpj) => isCNPJ(cnpj), { message: "CNPJ inválido." }),
    email: z
        .string()
        .nonempty({ message: "E-mail é obrigatório." })
        .email({ message: "E-mail inválido." }),
    phone: z
        .string()
        .nonempty({ message: "Telefone é obrigatório." })
        .min(10, { message: "Telefone deve conter no mínimo 10 dígitos." })
        .max(11, { message: "Telefone deve conter no máximo 11 dígitos." })
        .regex(/^[0-9]+$/, { message: "Telefone deve conter apenas números." }),
    address: z
        .string()
        .nonempty({ message: "Endereço é obrigatório." })
        .max(150, { message: "Endereço deve ter no máximo 150 caracteres." }),
    state: z.string().nonempty({ message: "Estado é obrigatório." }),
    city: z.string().nonempty({ message: "Cidade é obrigatória." }),
});

export default unitSchema;
