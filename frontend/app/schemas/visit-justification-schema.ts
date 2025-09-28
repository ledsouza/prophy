import { z } from "zod";

const visitJustificationSchema = z.object({
    justification: z
        .string()
        .min(1, { message: "Justificativa é obrigatória." })
        .transform((value) => value?.trim()),
});

export default visitJustificationSchema;
