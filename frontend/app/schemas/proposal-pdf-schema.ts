import { z } from "zod";

const MAX_FILE_SIZE = 10_000_000; // 10MB
const ACCEPTED_PDF_TYPES = ["application/pdf"];

const proposalPdfFileSchema = z.custom<FileList>().superRefine((file, ctx) => {
    if (!file || file.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "O arquivo PDF é obrigatório.",
        });
        return;
    }

    const f = file[0];

    if (!(f instanceof File)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "O arquivo PDF deve possuir formato válido.",
        });
        return;
    }

    if (f.size > MAX_FILE_SIZE) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "O arquivo PDF não pode ser maior que 10MB.",
        });
    }

    if (!ACCEPTED_PDF_TYPES.includes(f.type)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "O formato do arquivo deve ser PDF.",
        });
    }
});

export default proposalPdfFileSchema;
