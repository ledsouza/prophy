import { z } from "zod";

const managedUserSchema = z.object({
    cpf: z.string().length(11, { message: "O CPF deve conter 11 dígitos." }),
    name: z.string().min(1, { message: "Nome é obrigatório." }),
    email: z.email({ message: "E-mail inválido." }),
    phone: z.string().length(11, { message: "Celular deve conter 11 dígitos." }),
    roleOption: z
        .object({
            id: z.number(),
            value: z.string(),
        })
        .nullable(),
    isActive: z.boolean(),
});

export type ManagedUserFormFields = z.infer<typeof managedUserSchema>;

export default managedUserSchema;
