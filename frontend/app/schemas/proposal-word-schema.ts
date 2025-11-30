import { z } from "zod";

const MAX_FILE_SIZE = 10_000_000; // 10MB
const ACCEPTED_WORD_TYPES = [
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

const proposalWordFileSchema = z.custom<FileList>().superRefine((file, ctx) => {
    if (!file || file.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "O arquivo Word é obrigatório.",
        });
        return;
    }

    const f = file[0];

    if (!(f instanceof File)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "O arquivo Word deve possuir formato válido.",
        });
        return;
    }

    if (f.size > MAX_FILE_SIZE) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "O arquivo Word não pode ser maior que 10MB.",
        });
    }

    if (!ACCEPTED_WORD_TYPES.includes(f.type)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "O formato do arquivo deve ser DOC ou DOCX.",
        });
    }
});

export default proposalWordFileSchema;
