import { z } from "zod";

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const requiredFileSchema = z.custom<FileList>().superRefine((file, ctx) => {
    // Check if file is provided since it's required now
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
            message: "O arquivo deve ser um arquivo válido.",
        });
        return;
    }

    // Validate file size
    if (file[0].size > MAX_FILE_SIZE) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "O arquivo não pode ser maior que 5MB.",
        });
    }

    // Validate file type
    if (!ACCEPTED_IMAGE_TYPES.includes(file[0].type)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "O formato do arquivo deve ser jpg, jpeg ou png.",
        });
    }
});

const equipmentSchema = z.object({
    modality: z.number().min(1, { message: "Modalidade é obrigatório." }),
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
    equipment_photo: requiredFileSchema,
    label_photo: requiredFileSchema,
});

export default equipmentSchema;
