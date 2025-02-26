import { z } from "zod";
import requiredFileSchema from "./required-file-schema";

const accessorySchema = z.object({
    model: z
        .string()
        .nonempty({ message: "Modelo é obrigatório." })
        .max(30, { message: "Modelo deve ter no máximo 30 caracteres." }),
    series_number: z.string().max(30, {
        message: "Número de série deve ter no máximo 30 caracteres.",
    }),
});

export default accessorySchema;
