"use client";

import { useParams, useRouter } from "next/navigation";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";

import { Typography } from "@/components/foundation";
import { Form, Input } from "@/components/forms";
import { Button } from "@/components/common";
import { checkPasswordScore } from "@/utils/validation";
import { useResetPasswordMutation } from "@/redux/features/authApiSlice";
import { toast } from "react-toastify";
import { handleApiError } from "@/redux/services/errorHandling";

const resetPasswordSchema = z
    .object({
        new_password: z
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
        re_new_password: z.string().min(8, {
            message: "A confirmaçao de senha deve conter no mínimo 8 caracteres.",
        }),
    })
    .refine((data) => data.new_password === data.re_new_password, {
        message: "As senhas não coincidem.",
        path: ["rePassword"],
    });

export type ResetPasswordFields = z.infer<typeof resetPasswordSchema>;

const ResetPasswordForm = () => {
    const params = useParams<{ uid: string; token: string }>();
    const router = useRouter();
    const [resetPassword] = useResetPasswordMutation();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordFields>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const handleFormSubmit: SubmitHandler<ResetPasswordFields> = async (data) => {
        try {
            await resetPassword({
                ...data,
                uid: params.uid,
                token: params.token,
            }).unwrap();

            toast.success("Senha criada com sucesso. Você já pode acessar sua conta.");
            router.replace("/auth/login");
        } catch (error) {
            handleApiError(error, "Reset password error");
        }
    };

    return (
        <Form onSubmit={handleSubmit(handleFormSubmit)}>
            <Typography element="h3" size="title3">
                Redefinir senha
            </Typography>
            <Input
                {...register("new_password")}
                type="password"
                errorMessage={errors.new_password?.message}
                placeholder="Crie uma senha forte"
                data-testid="password-input"
            >
                Senha
            </Input>
            <Input
                {...register("re_new_password")}
                type="password"
                errorMessage={errors.re_new_password?.message}
                placeholder="Digite a senha novamente"
                data-testid="repassword-input"
            >
                Confirmação da senha
            </Input>

            <div className="flex gap-2 py-4">
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    data-testid="submit-btn"
                    className="w-full"
                >
                    Salvar
                </Button>
            </div>
        </Form>
    );
};

export default ResetPasswordForm;
