"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import { isCNPJ } from "validation-br";

import { clientSchema } from "@/schemas";

import { useCreateClientMutation } from "@/redux/features/clientApiSlice";
import { closeModal, setModalCloseDisabled } from "@/redux/features/modalSlice";
import { useAppDispatch } from "@/redux/hooks";
import { handleApiError } from "@/redux/services/errorHandling";
import { useListManagedUsersQuery } from "@/redux/features/authApiSlice";
import { useAddUserToClientMutation } from "@/redux/features/userAssociationsApiSlice";

import { useIBGELocalidades } from "@/hooks";

import { Button, Spinner } from "@/components/common";
import { ComboBox, Form, Input, MultiSelect } from "@/components/forms";
import { Typography } from "@/components/foundation";
import Role from "@/enums/Role";
import type { UserDTO } from "@/types/user";

const createClientSchema = clientSchema.extend({
    cnpj: z
        .string()
        .length(14, { message: "CNPJ deve conter 14 caracteres." })
        .refine((cnpj) => isCNPJ(cnpj), { message: "CNPJ inválido." })
        .transform((value) => value?.trim()),
});

export type CreateClientFields = z.infer<typeof createClientSchema>;

type CreateClientFormFields = z.input<typeof createClientSchema>;

type CreateClientFormProps = {
    title?: string;
    description?: string;
};

const CreateClientForm = ({ title, description }: CreateClientFormProps) => {
    const dispatch = useAppDispatch();
    const [currentStep, setCurrentStep] = useState<"details" | "users">("details");
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        setValue,
        getValues,
        reset,
    } = useForm<CreateClientFormFields>({
        resolver: zodResolver(createClientSchema),
    });

    const {
        estados,
        isEstadosSuccess,
        selectedEstado,
        handleEstadoChange,
        municipios,
        isMunicipiosSuccess,
        selectedMunicipio,
        handleMunicipioChange,
    } = useIBGELocalidades(setValue);

    const [createClient] = useCreateClientMutation();
    const [addUserToClient, { isLoading: isAddingUser }] = useAddUserToClientMutation();
    const { data: managedUsers, isLoading: isManagedUsersLoading } = useListManagedUsersQuery({
        page: 1,
    });
    const isAssociatingUsers = isManagedUsersLoading || isAddingUser;

    const allowedRoles = useMemo(() => new Set<Role>([Role.FMI, Role.FME, Role.GP, Role.C]), []);
    const availableUsers = useMemo(
        () => (managedUsers?.results ?? []).filter((user: UserDTO) => allowedRoles.has(user.role)),
        [allowedRoles, managedUsers?.results],
    );

    const userOptions = useMemo(
        () =>
            availableUsers.map((user) => ({
                id: user.id,
                value: `${user.name} • ${user.cpf}`,
            })),
        [availableUsers],
    );

    useEffect(() => {
        const shouldBlockClose = currentStep === "users";
        dispatch(setModalCloseDisabled(shouldBlockClose));
        return () => {
            dispatch(setModalCloseDisabled(false));
        };
    }, [currentStep, dispatch]);

    const handleFieldErrors = (error: unknown) => {
        if (
            typeof error === "object" &&
            error !== null &&
            "data" in error &&
            typeof (error as any).data === "object" &&
            (error as any).data !== null
        ) {
            const data = (error as { data: Record<string, unknown> }).data;

            const fieldErrors: Array<{ field: keyof CreateClientFields; message: string }> = [];
            for (const [field, value] of Object.entries(data)) {
                if (typeof value === "string" && field in createClientSchema.shape) {
                    fieldErrors.push({
                        field: field as keyof CreateClientFields,
                        message: value,
                    });
                }

                if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
                    if (field in createClientSchema.shape) {
                        fieldErrors.push({
                            field: field as keyof CreateClientFields,
                            message: value[0],
                        });
                    }
                }
            }

            if (fieldErrors.length > 0) {
                fieldErrors.forEach(({ field, message }) => {
                    setError(field, { message });
                });
                return true;
            }
        }

        return false;
    };

    const onSubmit: SubmitHandler<CreateClientFormFields> = async () => {
        setCurrentStep("users");
    };

    const handleAssociationSubmit = async () => {
        if (selectedUserIds.length === 0) {
            toast.error("Selecione ao menos um usuário para associar.");
            return;
        }

        const formValues = getValues();

        try {
            const response = await createClient(formValues);

            if (response.error) {
                const mapped = handleFieldErrors(response.error);
                if (!mapped) {
                    handleApiError(response.error, "Client creation error");
                }
                toast.error("Não foi possível criar o cliente.");
                setCurrentStep("details");
                return;
            }

            const clientId = response.data?.id ?? null;

            if (!clientId) {
                handleApiError(response.error, "Client creation error");
                toast.error("Não foi possível criar o cliente.");
                setCurrentStep("details");
                return;
            }

            await Promise.all(
                selectedUserIds.map((userId) => addUserToClient({ clientId, userId }).unwrap()),
            );
            toast.success("Cliente criado com sucesso!");
            dispatch(closeModal());
            reset();
            setCurrentStep("details");
            setSelectedUserIds([]);
        } catch (error) {
            handleApiError(error, "User association error");
        }
    };

    const handleCancel = () => {
        if (currentStep === "users") {
            toast.error("Associe pelo menos um usuário antes de sair.");
            return;
        }

        dispatch(closeModal());
    };

    const handleBack = () => {
        setCurrentStep("details");
    };

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            {currentStep === "details" ? (
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Typography element="h3" size="title3" className="font-semibold">
                        {title || "Criar Cliente"}
                    </Typography>
                    {description && (
                        <Typography element="p" size="md" className="text-justify">
                            {description}
                        </Typography>
                    )}

                    <Input
                        {...register("cnpj")}
                        type="text"
                        errorMessage={errors.cnpj?.message}
                        placeholder="Digite o CNPJ"
                        label="CNPJ"
                        dataCy="create-client-cnpj"
                    />

                    <Input
                        {...register("name")}
                        type="text"
                        errorMessage={errors.name?.message}
                        placeholder="Digite o nome completo da instituição"
                        label="Nome"
                        dataCy="create-client-name"
                    />

                    <Input
                        {...register("email")}
                        type="email"
                        errorMessage={errors.email?.message}
                        placeholder="nome@email.com"
                        label="E-mail"
                        dataCy="create-client-email"
                    />

                    <Input
                        {...register("phone")}
                        type="text"
                        errorMessage={errors.phone?.message}
                        placeholder="DD9XXXXXXXX"
                        label="Telefone"
                        dataCy="create-client-phone"
                    />

                    {isEstadosSuccess && estados ? (
                        <ComboBox
                            data={estados.map((estado) => ({
                                id: estado.id,
                                name: estado.nome,
                                sigla: estado.sigla,
                            }))}
                            errorMessage={
                                errors.state ? "Estado da instituição é obrigatório." : ""
                            }
                            placeholder="Digite o estado e selecione"
                            selectedValue={selectedEstado}
                            onChange={handleEstadoChange}
                            dataCy="create-client-state"
                        >
                            Estado
                        </ComboBox>
                    ) : (
                        <div className="flex justify-center py-2">
                            <Spinner />
                        </div>
                    )}

                    {isMunicipiosSuccess && municipios ? (
                        <ComboBox
                            data={municipios.map((municipio) => ({
                                id: municipio.id,
                                name: municipio.nome,
                            }))}
                            errorMessage={errors.city ? "Cidade da instituição é obrigatória." : ""}
                            placeholder="Digite a cidade e selecione"
                            selectedValue={selectedMunicipio}
                            onChange={handleMunicipioChange}
                            dataCy="create-client-city"
                        >
                            Cidade
                        </ComboBox>
                    ) : (
                        <Input
                            disabled
                            errorMessage={errors.city ? "Cidade da instituição é obrigatória." : ""}
                            placeholder="Selecione um estado"
                            label="Cidade"
                            dataCy="create-client-city"
                        />
                    )}

                    <Input
                        {...register("address")}
                        type="text"
                        errorMessage={errors.address?.message}
                        placeholder="Rua, número, bairro"
                        label="Endereço"
                        dataCy="create-client-address"
                    />

                    <div className="flex gap-2 py-4">
                        <Button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleCancel}
                            variant="secondary"
                            dataCy="create-client-cancel"
                            className="w-full"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            dataCy="create-client-submit"
                            className="w-full"
                        >
                            {isSubmitting ? "Continuando..." : "Continuar"}
                        </Button>
                    </div>
                </Form>
            ) : (
                <div className="space-y-4">
                    <Typography element="h3" size="title3" className="font-semibold">
                        Associar usuários
                    </Typography>
                    <Typography element="p" size="md" className="text-justify">
                        Selecione um ou mais usuários para associar ao cliente.
                    </Typography>

                    {isManagedUsersLoading ? (
                        <Spinner />
                    ) : (
                        <MultiSelect
                            label="Usuários"
                            options={userOptions}
                            value={selectedUserIds}
                            onChange={setSelectedUserIds}
                            dataTestId="create-client-users"
                            dataCy="create-client-users"
                        />
                    )}

                    <div className="flex gap-2 py-4">
                        <Button
                            type="button"
                            variant="secondary"
                            dataCy="create-client-users-back"
                            className="w-full"
                            onClick={handleBack}
                        >
                            Voltar
                        </Button>
                        <Button
                            type="button"
                            dataCy="create-client-users-submit"
                            className="w-full"
                            onClick={handleAssociationSubmit}
                            disabled={selectedUserIds.length === 0 || isAssociatingUsers}
                        >
                            Associar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateClientForm;
