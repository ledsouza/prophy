import { z } from "zod";

const serviceOrderSchema = z.object({
    subject: z
        .string()
        .min(1, { message: "Assunto é obrigatório." })
        .max(50, { message: "Assunto deve ter no máximo 50 caracteres." })
        .transform((value) => value?.trim()),
    description: z
        .string()
        .min(1, { message: "Descrição é obrigatória." })
        .transform((value) => value?.trim()),
    conclusion: z
        .string()
        .min(1, { message: "Conclusão é obrigatória." })
        .transform((value) => value?.trim()),
    updates: z.string().trim().nullable().optional(),
    equipments: z.array(z.number()).default([]),
});

export default serviceOrderSchema;
