import { z } from "zod";

import pdfFileSchema from "./pdf-file-schema";
import wordFileSchema from "./word-file-schema";

const createReportSchema = z.object({
    completion_date: z
        .string()
        .min(1, { message: "Data de conclusão é obrigatória." })
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data inválida." }),
    description: z
        .string()
        .min(1, { message: "Descrição é obrigatória." })
        .transform((value) => value?.trim()),
    pdf_file: pdfFileSchema,
    word_file: wordFileSchema,
});

export type CreateReportFormData = z.infer<typeof createReportSchema>;

export default createReportSchema;
