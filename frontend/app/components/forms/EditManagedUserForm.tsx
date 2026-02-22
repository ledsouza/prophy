"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/common";
import { Form } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { managedUserSchema, type ManagedUserFormFields } from "@/schemas";
import { MANAGEABLE_ROLE_OPTIONS, roleFromOption } from "@/utils/roles";
import type { UserDTO } from "@/types/user";

import ManagedUserFields from "./ManagedUserFields";

type EditManagedUserFormProps = {
    user: UserDTO;
    onSubmit: (values: ManagedUserFormFields) => Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
};

const EditManagedUserForm = ({
    user,
    onSubmit,
    onCancel,
    isSubmitting,
}: EditManagedUserFormProps) => {
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<ManagedUserFormFields>({
        resolver: zodResolver(managedUserSchema),
        defaultValues: {
            cpf: "",
            name: "",
            email: "",
            phone: "",
            roleOption: null,
            isActive: true,
        },
    });

    useEffect(() => {
        reset({
            cpf: user.cpf,
            name: user.name,
            email: user.email,
            phone: user.phone,
            roleOption:
                MANAGEABLE_ROLE_OPTIONS.find((o) => roleFromOption(o) === user.role) ??
                MANAGEABLE_ROLE_OPTIONS[0],
            isActive: user.is_active ?? true,
        });
    }, [reset, user]);

    return (
        <Form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <Typography element="h3" size="title3" className="font-semibold">
                Editar usuário
            </Typography>

            <ManagedUserFields
                mode="edit"
                register={register}
                errors={errors}
                roleOption={watch("roleOption")}
                setRoleOption={(v) => setValue("roleOption", v)}
            />

            <div className="flex gap-2 pt-4">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    className="w-full"
                    dataCy="gp-users-edit-cancel"
                    disabled={isSubmitting}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    className="w-full"
                    dataCy="gp-users-edit-submit"
                    disabled={isSubmitting}
                >
                    Salvar
                </Button>
            </div>
        </Form>
    );
};

export default EditManagedUserForm;
