import { z } from "zod";

export const profileSchema = z.object({
    name: z.string().min(1, {
        message: "O nome é obrigatório.",
    }),
    email: z.email({
        message: "Digite um e-mail válido.",
    }),
    phone: z.string().min(1, {
        message: "O telefone é obrigatório.",
    }),
});

export type ProfileFormFields = z.infer<typeof profileSchema>;