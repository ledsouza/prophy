import { z } from "zod";

import { checkPasswordScore } from "@/utils/validation";

export const changePasswordSchema = z
    .object({
        current_password: z.string().min(1, {
            message: "A senha atual é obrigatória.",
        }),
        new_password: z
            .string()
            .min(8, {
                message: "A nova senha deve conter no mínimo 8 caracteres.",
            })
            .refine((value) => !/^\d+$/.test(value), {
                message: "Evite senhas que contenham apenas números.",
            })
            .refine(checkPasswordScore, {
                message:
                    "Sua senha é muito fraca e coloca sua conta em risco. Por favor, crie uma senha mais forte.",
            }),
        re_new_password: z.string().min(8, {
            message:
                "A confirmação da nova senha deve conter no mínimo 8 caracteres.",
        }),
    })
    .refine((data) => data.new_password === data.re_new_password, {
        message: "As senhas não coincidem.",
        path: ["re_new_password"],
    });

export type ChangePasswordFormFields = z.infer<typeof changePasswordSchema>;