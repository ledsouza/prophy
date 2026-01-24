import { z } from "zod";
import reportFileSchema from "./report-file-schema";

const materialUpdateSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, { message: "Título é obrigatório." })
        .max(150, { message: "Título deve ter no máximo 150 caracteres." }),
    description: z
        .string()
        .trim()
        .transform((s) => (s === "" ? undefined : s))
        .optional(),
    file: z
        .preprocess(
            (v) => (v instanceof FileList && v.length === 0 ? undefined : v),
            reportFileSchema.optional(),
        )
        .optional(),
});

export default materialUpdateSchema;
