"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/common";
import { Form } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { managedUserSchema, type ManagedUserFormFields } from "@/schemas";

import ManagedUserFields from "./ManagedUserFields";

type CreateManagedUserFormProps = {
    onSubmit: (values: ManagedUserFormFields) => Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
};

const CreateManagedUserForm = ({
    onSubmit,
    onCancel,
    isSubmitting,
}: CreateManagedUserFormProps) => {
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

    return (
        <Form
            onSubmit={handleSubmit(async (values) => {
                await onSubmit(values);
                reset();
            })}
            className="w-full"
        >
            <Typography element="h3" size="title3" className="font-semibold">
                Criar usuário
            </Typography>

            <ManagedUserFields
                mode="create"
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
                    dataCy="gp-users-create-cancel"
                    disabled={isSubmitting}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    className="w-full"
                    dataCy="gp-users-create-submit"
                    disabled={isSubmitting}
                >
                    Salvar
                </Button>
            </div>
        </Form>
    );
};

export default CreateManagedUserForm;
