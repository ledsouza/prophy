"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { Button } from "@/components/common";
import { Typography } from "@/components/foundation";
import { Form, Input } from "@/components/forms";
import { useChangeOwnPasswordMutation } from "@/redux/features/authApiSlice";
import { handleApiError } from "@/redux/services/errorHandling";
import {
    changePasswordSchema,
    type ChangePasswordFormFields,
} from "@/schemas/change-password-schema";

const ChangePasswordForm = () => {
    const [changeOwnPassword] = useChangeOwnPasswordMutation();
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ChangePasswordFormFields>({
        resolver: zodResolver(changePasswordSchema),
    });

    const onSubmit = async (data: ChangePasswordFormFields) => {
        try {
            await changeOwnPassword(data).unwrap();
            toast.success("Senha atualizada com sucesso.");
            reset();
        } catch (error) {
            handleApiError(error, "Change password error");
        }
    };

    return (
        <section className="rounded-xl border border-gray-tertiary/40 bg-white p-6 shadow-sm">
            <Typography element="h2" size="title3" className="font-semibold text-primary">
                Alterar senha
            </Typography>
            <Typography element="p" size="sm" className="mt-2 text-gray-secondary">
                Informe sua senha atual e defina uma nova senha.
            </Typography>

            <Form onSubmit={handleSubmit(onSubmit)} className="mt-6">
                <Input
                    {...register("current_password")}
                    label="Senha atual"
                    type="password"
                    errorMessage={errors.current_password?.message}
                    data-cy="profile-current-password-input"
                />
                <Input
                    {...register("new_password")}
                    label="Nova senha"
                    type="password"
                    errorMessage={errors.new_password?.message}
                    data-cy="profile-new-password-input"
                />
                <Input
                    {...register("re_new_password")}
                    label="Confirmar nova senha"
                    type="password"
                    errorMessage={errors.re_new_password?.message}
                    data-cy="profile-confirm-password-input"
                />

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-4 w-full sm:w-auto"
                    data-cy="profile-change-password-btn"
                >
                    Atualizar senha
                </Button>
            </Form>
        </section>
    );
};

export default ChangePasswordForm;