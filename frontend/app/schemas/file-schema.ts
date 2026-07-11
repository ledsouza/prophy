import { z } from "zod";

type FileSchemaOptions = {
    required: boolean;
    maxSizeBytes: number;
    acceptedTypes: string[];
    typeMessage: string;
    requiredMessage?: string;
    sizeMessage?: string;
    invalidFormatMessage?: string;
};

/**
 * Builds a Zod schema for a single-file `<input type="file">` (RHF
 * FileList), validating presence, size, and MIME type consistently
 * across every file-upload form.
 */
function createFileSchema<T extends FileList | null = FileList>({
    required,
    maxSizeBytes,
    acceptedTypes,
    typeMessage,
    requiredMessage = "O arquivo é obrigatório.",
    sizeMessage = `O arquivo não pode ser maior que ${Math.round(maxSizeBytes / 1_000_000)}MB.`,
    invalidFormatMessage = "O arquivo deve possuir formato válido.",
}: FileSchemaOptions) {
    return z.custom<T>().superRefine((file, ctx) => {
        if (!file || file.length === 0) {
            if (required) {
                ctx.addIssue({
                    code: "custom",
                    message: requiredMessage,
                });
            }
            return;
        }

        const uploadedFile = file[0];

        if (!(uploadedFile instanceof File)) {
            ctx.addIssue({
                code: "custom",
                message: invalidFormatMessage,
            });
            return;
        }

        if (uploadedFile.size > maxSizeBytes) {
            ctx.addIssue({
                code: "custom",
                message: sizeMessage,
            });
        }

        if (!acceptedTypes.includes(uploadedFile.type)) {
            ctx.addIssue({
                code: "custom",
                message: typeMessage,
            });
        }
    });
}

export default createFileSchema;
