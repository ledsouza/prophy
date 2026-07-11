import { z } from "zod";

import { MAX_DOCUMENT_FILE_SIZE_BYTES } from "@/constants/fileSize";

import createFileSchema from "./file-schema";

const optionalReportPdfSchema = createFileSchema({
    required: false,
    maxSizeBytes: MAX_DOCUMENT_FILE_SIZE_BYTES,
    acceptedTypes: ["application/pdf"],
    sizeMessage: `O arquivo PDF não pode ser maior que ${MAX_DOCUMENT_FILE_SIZE_BYTES / 1_000_000}MB.`,
    typeMessage: "O formato do arquivo deve ser PDF.",
});

const optionalReportWordSchema = createFileSchema({
    required: false,
    maxSizeBytes: MAX_DOCUMENT_FILE_SIZE_BYTES,
    acceptedTypes: [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    sizeMessage: `O arquivo Word não pode ser maior que ${MAX_DOCUMENT_FILE_SIZE_BYTES / 1_000_000}MB.`,
    typeMessage: "O formato do arquivo deve ser DOC ou DOCX.",
});

const updateReportFileFormSchema = z
    .object({
        pdf_file: z.custom<FileList>(),
        word_file: z.custom<FileList>(),
    })
    .superRefine((data, ctx) => {
        const hasPdf = data.pdf_file instanceof FileList && data.pdf_file.length > 0;
        const hasWord = data.word_file instanceof FileList && data.word_file.length > 0;

        if (!hasPdf && !hasWord) {
            ctx.addIssue({
                code: "custom",
                message: "Selecione ao menos um arquivo.",
                path: ["pdf_file"],
            });
            return;
        }

        if (hasPdf) {
            const result = optionalReportPdfSchema.safeParse(data.pdf_file);
            if (!result.success) {
                for (const issue of result.error.issues) {
                    ctx.addIssue({ ...issue, path: ["pdf_file"] });
                }
            }
        }

        if (hasWord) {
            const result = optionalReportWordSchema.safeParse(data.word_file);
            if (!result.success) {
                for (const issue of result.error.issues) {
                    ctx.addIssue({ ...issue, path: ["word_file"] });
                }
            }
        }
    });

export type UpdateReportFileFormData = z.infer<typeof updateReportFileFormSchema>;

export default updateReportFileFormSchema;
