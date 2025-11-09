import { z } from "zod";

const MAX_FILE_SIZE = 10000000; // 10MB
const ACCEPTED_REPORT_TYPES = [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

const reportFileSchema = z.custom<FileList>().superRefine((file, ctx) => {
    // Check if file is provided
    if (!file || file.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "O arquivo é obrigatório.",
        });
        return;
    }

    // Ensure the file is actually a File instance
    if (!(file[0] instanceof File)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "O arquivo deve possuir formato válido.",
        });
        return;
    }

    // Validate file size
    if (file[0].size > MAX_FILE_SIZE) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "O arquivo não pode ser maior que 10MB.",
        });
    }

    // Validate file type
    if (!ACCEPTED_REPORT_TYPES.includes(file[0].type)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "O formato do arquivo deve ser PDF, DOC ou DOCX.",
        });
    }
});

export default reportFileSchema;
