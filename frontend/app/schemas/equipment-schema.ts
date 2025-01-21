import { z } from "zod";

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const optionalFileSchema = z
    .custom<FileList | undefined>()
    .superRefine((file, ctx) => {
        // If no file is provided (which happens when no file is selected),
        // it will return an empty FileList. This field is optional, so
        // skip validation
        if (file?.length === 0) {
            return;
        }

        // Ensure the file is actually a File instance
        if (!file || !(file[0] instanceof File)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "O arquivo deve ser um arquivo válido.",
            });
            return;
        }

        // Validate file size
        if (!file || file[0].size > MAX_FILE_SIZE) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "O arquivo não pode ser maior que 5MB.",
            });
        }

        // Validate file type
        if (!file || !ACCEPTED_IMAGE_TYPES.includes(file[0].type)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "O formato do arquivo deve ser jpg, jpeg ou png.",
            });
        }
    });

const equipmentSchema = z.object({
    modality: z
        .string()
        .nonempty({ message: "Modalidade é obrigatório." })
        .max(50, { message: "Modalidade deve ter no máximo 50 caracteres." }),
    manufacturer: z
        .string()
        .nonempty({ message: "Fabricante é obrigatório." })
        .max(30, { message: "Fabricante deve ter no máximo 30 caracteres." }),
    model: z
        .string()
        .nonempty({ message: "Modelo é obrigatório." })
        .max(30, { message: "Modelo deve ter no máximo 30 caracteres." }),
    series_number: z.string().max(30, {
        message: "Número de série deve ter no máximo 30 caracteres.",
    }),
    anvisa_registry: z.string().max(30, {
        message: "Registro na ANVISA deve ter no máximo 30 caracteres.",
    }),
    equipment_photo: optionalFileSchema,
    label_photo: optionalFileSchema,
});

export default equipmentSchema;
