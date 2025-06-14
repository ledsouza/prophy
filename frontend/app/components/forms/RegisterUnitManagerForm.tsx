"use client";

import { useEffect, useCallback, useState } from "react";

import { debounce } from "lodash";
import { toast } from "react-toastify";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { unitManagerSchema } from "@/schemas";

import { useAppDispatch } from "@/redux/hooks";
import { closeModal } from "@/redux/features/modalSlice";
import {
    useRegisterUnitManagerMutation,
    useLazyGetByCPFQuery,
} from "@/redux/features/authApiSlice";
import { handleApiError } from "@/redux/services/errorHandling";

import { Form, Input } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { Button } from "@/components/common";
import { useUpdateUnitMutation } from "@/redux/features/unitApiSlice";

export type RegisterFields = z.infer<typeof unitManagerSchema>;

type RegisterUnitManagerFormProps = {
    unitID: number;
    title?: string;
    description?: string;
};

const RegisterUnitManagerForm = ({ unitID, title, description }: RegisterUnitManagerFormProps) => {
    const dispatch = useAppDispatch();
    const [registerUnitManager] = useRegisterUnitManagerMutation();
    const [triggerGetByCPF, { isLoading: isCPFChecking }] = useLazyGetByCPFQuery();
    const [updateUnit] = useUpdateUnitMutation();
    const [registeredUser, setRegisteredUser] = useState<number | null>(null);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFields>({
        resolver: zodResolver(unitManagerSchema),
    });

    const cpfValue = useWatch({
        control: control,
        name: "cpf",
    });

    const debouncedCPFCheck = useCallback(
        debounce(async (cpf: string) => {
            const cpfSchema = unitManagerSchema.shape.cpf;
            const result = cpfSchema.safeParse(cpf);

            if (result.success) {
                try {
                    const response = await triggerGetByCPF(cpf).unwrap();
                    if (response.results && response.results.length > 0) {
                        const user = response.results[0];
                        setValue("name", user.name);
                        setValue("email", user.email);
                        setValue("phone", user.phone);
                        toast.info("Usuário já cadastrado. Dados preenchidos automaticamente.");
                        setRegisteredUser(user.id);
                    }
                } catch (error) {
                    console.error("Erro ao verificar CPF:", error);
                }
            }
        }, 500),
        [triggerGetByCPF]
    );

    const onSubmit: SubmitHandler<RegisterFields> = async (data) => {
        if (isCPFChecking) {
            toast.warn("Por favor, aguarde a verificação do CPF terminar.");
            return;
        }

        try {
            registeredUser
                ? updateUnit({
                      unitID: unitID,
                      unitData: {
                          user: registeredUser,
                      },
                  })
                : await registerUnitManager({
                      ...data,
                      unit_id: unitID,
                  }).unwrap();

            toast.success("Gerente de unidade registrado com sucesso.");
            dispatch(closeModal());
        } catch (error) {
            handleApiError(error, "Registration error");
        }
    };

    useEffect(() => {
        if (cpfValue) {
            debouncedCPFCheck(cpfValue);
        }
        // Cleanup function to cancel the debounce timer if the component unmounts
        return () => {
            debouncedCPFCheck.cancel();
        };
    }, [cpfValue, debouncedCPFCheck]);

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Typography element="h3" size="title3" className="font-semibold">
                    {title}
                </Typography>

                <Typography element="p" size="md" className="text-justify">
                    {description}
                </Typography>

                <Input
                    {...register("cpf")}
                    type="text"
                    errorMessage={errors.cpf?.message}
                    placeholder="Digite o CPF do gerente de unidade"
                    disabled={isCPFChecking}
                    data-testid="unit-manager-cpf-input"
                >
                    CPF {isCPFChecking && <span className="text-gray-500">(verificando...)</span>}
                </Input>
                <Input
                    {...register("name")}
                    type="text"
                    errorMessage={errors.name?.message}
                    placeholder="Digite o nome completo do gerente de unidade"
                    data-testid="unit-manager-name-input"
                >
                    Nome
                </Input>
                <Input
                    {...register("email")}
                    type="text"
                    errorMessage={errors.email?.message}
                    placeholder="Digite o email do gerente de unidade"
                    data-testid="unit-manager-email-input"
                >
                    E-mail
                </Input>
                <Input
                    {...register("phone")}
                    type="text"
                    errorMessage={errors.phone?.message}
                    placeholder="Digite o número de celular do gerente de unidade"
                    data-testid="unit-manager-phone-input"
                >
                    Número do celular
                </Input>

                <div className="flex gap-2 py-4">
                    <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => dispatch(closeModal())}
                        variant="secondary"
                        className="w-full"
                        data-testid="cancel-btn"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        data-testid="submit-btn"
                        className="w-full"
                    >
                        Atribuir
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default RegisterUnitManagerForm;
