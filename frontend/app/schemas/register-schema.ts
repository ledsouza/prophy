import { z } from "zod";
import { isCPF } from "validation-br";
import { checkPasswordScore, isValidPhonePTBR } from "@/utils/validation";

const registerSchema = z
    .object({
        cpf: z.string().length(11, { message: "O CPF deve conter 11 caracteres." }).refine(isCPF, {
            message:
                "CPF inválido. Certifique-se de que você digitou todos os 11 dígitos corretamente.",
        }),
        password: z
            .string()
            .min(8, {
                message: "A senha deve conter no mínimo 8 caracteres.",
            })
            .refine((val) => !/^\d+$/.test(val), {
                message: "Evite senhas que contenham apenas números.",
            })
            .refine(checkPasswordScore, {
                message:
                    "Sua senha é muito fraca e coloca sua conta em risco. Por favor, crie uma senha mais forte.",
            }),
        rePassword: z.string().min(8, {
            message: "A confirmaçao de senha deve conter no mínimo 8 caracteres.",
        }),
        institutionName: z
            .string()
            .min(1, { message: "Nome da instituição é obrigatório." })
            .max(50, {
                message: "Nome da instituição não pode exceder 50 caracteres.",
            }),
        contactName: z.string().min(1, { message: "Nome do contato é obrigatório." }).max(50, {
            message: "Nome do contato não pode exceder 50 caracteres.",
        }),
        contactEmail: z.string().email({ message: "E-mail do contato inválido." }),
        contactPhone: z
            .string()
            .length(11, {
                message: "O número de celular deve estar no padrão de 11 dígitos (DD9XXXXXXXX).",
            })
            .refine((value) => /^\d{2}9\d{8}$/.test(value), {
                message: "O número de celular deve estar no padrão de 11 dígitos (DD9XXXXXXXX).",
            }),
        institutionEmail: z.string().email({ message: "E-mail da instituição inválido." }),
        institutionPhone: z
            .string()
            .min(10, { message: "Telefone deve conter no mínimo 10 dígitos." })
            .max(11, { message: "Telefone deve conter no máximo 11 dígitos." })
            .refine((value) => isValidPhonePTBR(value), {
                message: "Telefone deve conter apenas números com padrão nacional (DDXXXXXXXX).",
            }),
        address: z.string().min(1, { message: "Endereço da instituição é obrigatório." }),
        state: z.string().min(1, { message: "Estado da instituição é obrigatório." }),
        city: z.string().min(1, { message: "Cidade da instituição é obrigatório." }),
    })
    .refine((data) => data.password === data.rePassword, {
        message: "As senhas não coincidem.",
        path: ["rePassword"],
    });

export default registerSchema;
