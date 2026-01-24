import { isCNPJ } from "validation-br";
import { z } from "zod";
import { ContractType } from "@/enums";

const proposalSchema = z.object({
    cnpj: z.string().length(14, { message: "O CNPJ deve conter 14 caracteres." }).refine(isCNPJ, {
        message:
            "CNPJ inválido. Certifique-se de que você digitou todos os 14 dígitos corretamente.",
    }),
    state: z.string().min(1, { message: "Estado é obrigatório." }),
    city: z.string().min(1, { message: "Cidade é obrigatória." }),
    contact_name: z
        .string()
        .min(1, { message: "Nome do contato é obrigatório." })
        .min(2, { message: "Nome do contato deve ter pelo menos 2 caracteres." }),
    contact_phone: z
        .string()
        .min(1, { message: "Telefone do contato é obrigatório." })
        .regex(/^\d{11}$/, { message: "Telefone deve conter 11 dígitos (DDD + número)." }),
    email: z
        .string()
        .min(1, { message: "E-mail é obrigatório." })
        .email({ message: "E-mail inválido." }),
    date: z
        .string()
        .min(1, { message: "Data é obrigatória." })
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data inválida." }),
    value: z
        .string()
        .min(1, { message: "Valor é obrigatório." })
        .refine((val) => !isNaN(Number(val)), { message: "Valor deve ser um número válido." })
        .refine((val) => Number(val) > 0, { message: "Valor deve ser maior que zero." }),
    contract_type: z.nativeEnum(ContractType, {
        message: "Tipo de contrato é obrigatório.",
    }),
});

export default proposalSchema;
