import { z } from "zod";
import accessorySchema from "./accessory-schema";

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
    channels: z
        .string()
        .max(10, {
            message: "Canais deve ter no máximo 10 caracteres.",
        })
        .optional(),
    official_max_load: z
        .union([
            z.number().int().positive().optional(),
            z
                .string()
                .transform((val) => (val === "" ? undefined : parseInt(val, 10)))
                .optional(),
        ])
        .optional(),
    usual_max_load: z
        .union([
            z.number().int().positive().optional(),
            z
                .string()
                .transform((val) => (val === "" ? undefined : parseInt(val, 10)))
                .optional(),
        ])
        .optional(),
    purchase_installation_date: z.string().optional(),
    maintenance_responsable: z
        .string()
        .max(50, {
            message: "Responsável pela manutenção deve ter no máximo 50 caracteres.",
        })
        .optional(),
    email_maintenance_responsable: z
        .union([z.string().email({ message: "E-mail inválido." }), z.string().length(0)])
        .optional(),
    phone_maintenance_responsable: z
        .string()
        .max(13, {
            message: "Telefone deve ter no máximo 13 caracteres.",
        })
        .optional(),
    accessories: z.array(accessorySchema),
    note: z
        .string()
        .optional()
        .transform((value) => value?.trim())
        .refine((value) => value === undefined || value.length > 0, {
            message: "A justificativa é obrigatória.",
        }),
});

export default equipmentSchema;
