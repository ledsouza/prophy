import { z } from "zod";
import requiredFileSchema from "./required-file-schema";
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
    accessories: z.array(accessorySchema),
});

export default equipmentSchema;
