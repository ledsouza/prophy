"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { Button } from "@/components/common";
import { Typography } from "@/components/foundation";
import { Form, Input } from "@/components/forms";
import { useUpdateOwnProfileMutation } from "@/redux/features/authApiSlice";
import { handleApiError } from "@/redux/services/errorHandling";
import { roleLabel } from "@/utils/roles";
import {
    profileSchema,
    type ProfileFormFields,
} from "@/schemas/profile-schema";
import type { UserDTO } from "@/types/user";

type ProfileFormProps = {
    user: UserDTO;
};

const ProfileForm = ({ user }: ProfileFormProps) => {
    const [updateOwnProfile] = useUpdateOwnProfileMutation();
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ProfileFormFields>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user.name,
            email: user.email,
            phone: user.phone,
        },
    });

    useEffect(() => {
        reset({
            name: user.name,
            email: user.email,
            phone: user.phone,
        });
    }, [reset, user.email, user.name, user.phone]);

    const onSubmit = async (data: ProfileFormFields) => {
        try {
            await updateOwnProfile(data).unwrap();
            toast.success("Perfil atualizado com sucesso.");
        } catch (error) {
            handleApiError(error, "Profile update error");
        }
    };

    return (
        <section className="rounded-xl border border-gray-tertiary/40 bg-white p-6 shadow-sm">
            <Typography element="h2" size="title3" className="font-semibold text-primary">
                Meus dados
            </Typography>
            <Typography element="p" size="sm" className="mt-2 text-gray-secondary">
                Atualize suas informações pessoais.
            </Typography>

            <Form onSubmit={handleSubmit(onSubmit)} className="mt-6">
                <Input label="CPF" value={user.cpf} disabled readOnly data-cy="profile-cpf-input" />
                <Input
                    label="Perfil"
                    value={roleLabel(user.role)}
                    disabled
                    readOnly
                    data-cy="profile-role-input"
                />
                <Input
                    {...register("name")}
                    label="Nome"
                    type="text"
                    errorMessage={errors.name?.message}
                    data-cy="profile-name-input"
                />
                <Input
                    {...register("email")}
                    label="E-mail"
                    type="email"
                    errorMessage={errors.email?.message}
                    data-cy="profile-email-input"
                />
                <Input
                    {...register("phone")}
                    label="Telefone"
                    type="text"
                    errorMessage={errors.phone?.message}
                    data-cy="profile-phone-input"
                />

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-4 w-full sm:w-auto"
                    data-cy="profile-save-btn"
                >
                    Salvar alterações
                </Button>
            </Form>
        </section>
    );
};

export default ProfileForm;