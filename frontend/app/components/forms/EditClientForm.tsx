"use client";

import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import {
    ClientDTO,
    useCreateEditClientOperationMutation,
    useEditClientMutation,
} from "@/redux/features/clientApiSlice";
import { isErrorWithMessages } from "@/redux/services/helpers";

import { useIBGELocalidades } from "@/hooks";
import { ComboBox, Form, Input } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { Button, Spinner } from "@/components/common";
import { isValidPhonePTBR } from "@/utils/validation";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";

const editClientSchema = z.object({
    name: z
        .string()
        .min(1, { message: "Nome da instituição é obrigatório." })
        .max(50, {
            message: "Nome da instituição não pode exceder 50 caracteres.",
        }),
    email: z.string().email({ message: "E-mail da instituição inválido." }),
    phone: z.string().refine((value) => isValidPhonePTBR(value), {
        message: "Telefone inválido.",
    }),
    address: z
        .string()
        .min(1, { message: "Endereço da instituição é obrigatório." }),
    state: z
        .string()
        .min(1, { message: "Estado da instituição é obrigatório." }),
    city: z
        .string()
        .min(1, { message: "Cidade da instituição é obrigatória." }),
});

export type EditClientFields = z.infer<typeof editClientSchema>;

type EditClientProps = {
    originalClient: ClientDTO;
    setIsModalOpen: (value: boolean) => void;
};

const EditClientForm = ({
    originalClient,
    setIsModalOpen,
}: EditClientProps) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
    } = useForm<EditClientFields>({
        resolver: zodResolver(editClientSchema),
        defaultValues: {
            name: originalClient.name,
            email: originalClient.email,
            phone: originalClient.phone,
            address: originalClient.address,
        },
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

    const { data: userData } = useRetrieveUserQuery();
    const needReview =
        userData?.role === "GGC" ||
        userData?.role === "FME" ||
        userData?.role === "GU";

    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [createEditClientOperation] = useCreateEditClientOperationMutation();
    const [editClient] = useEditClientMutation();

    const isDataUnchanged = (
        editData: EditClientFields,
        originalClient: Omit<ClientDTO, "users" | "id">
    ): boolean => {
        return Object.keys(editData).every(
            (key) =>
                editData[key as keyof EditClientFields].toLowerCase() ===
                originalClient[
                    key as keyof Omit<ClientDTO, "users" | "id">
                ].toLowerCase()
        );
    };

    const onSubmit: SubmitHandler<EditClientFields> = async (editData) => {
        if (isDataUnchanged(editData, originalClient)) {
            toast.warning("Nenhuma alteração foi detectada nos dados.");
            return;
        }

        try {
            const response = needReview
                ? await createEditClientOperation({
                      ...editData,
                      cnpj: originalClient.cnpj,
                      original_client: originalClient.id,
                  })
                : await editClient({
                      clientID: originalClient.id,
                      clientData: editData,
                  });

            if (response.error) {
                if (isErrorWithMessages(response.error)) {
                    throw new Error(response.error.data.messages[0]);
                }
                throw new Error("Um erro inesperado ocorreu.");
            }

            const successMessage = needReview
                ? "Requisição enviada com sucesso!"
                : "Dados atualizados com sucesso!";
            toast.success(successMessage);
            setIsModalOpen(false);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Algo deu errado. Tente novamente mais tarde."
            );
        }
    };

    useEffect(() => {
        if (isInitialLoad) {
            const estado = estados?.find(
                (estado) =>
                    estado.sigla?.toLowerCase() ===
                    originalClient.state.toLowerCase()
            );

            const municipio = municipios?.find(
                (municipio) =>
                    municipio.nome.toLowerCase() ===
                    originalClient.city.toLowerCase()
            );

            if (estado) {
                handleEstadoChange({
                    id: estado.id,
                    name: estado.nome,
                    sigla: estado.sigla,
                });
            }
            if (municipio) {
                handleMunicipioChange({
                    id: municipio.id,
                    name: municipio.nome,
                });
            }
        }

        if (estados && municipios) {
            setIsInitialLoad(false);
        }
    }, [estados, municipios]);

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Typography
                    element="h3"
                    size="title3"
                    className="font-semibold"
                >
                    Atualização de dados
                </Typography>
                <Typography element="p" size="md" className="text-justify">
                    Por favor, edite os campos que deseja atualizar,
                    certificando-se de preencher as informações corretamente.
                    Após a submissão, o formulário será enviado para análise de
                    um físico médico responsável, que fará a revisão e validação
                    das informações fornecidas.
                </Typography>
                <Input
                    {...register("name")}
                    type="text"
                    errorMessage={errors.name?.message}
                    placeholder="Digite o nome completo da instituição"
                    data-testid="institution-name-input"
                >
                    Nome
                </Input>
                <Input
                    {...register("email")}
                    type="text"
                    errorMessage={errors.email?.message}
                    placeholder="nome@email.com"
                    data-testid="institution-email-input"
                >
                    E-mail
                </Input>
                <Input
                    {...register("phone")}
                    type="text"
                    errorMessage={errors.phone?.message}
                    placeholder="DD9XXXXXXXX"
                    data-testid="institution-phone-input"
                >
                    Telefone
                </Input>
                {isEstadosSuccess && estados ? (
                    <ComboBox
                        data={estados.map((estado) => ({
                            id: estado.id,
                            name: estado.nome,
                            sigla: estado.sigla,
                        }))}
                        errorMessage={
                            errors.state
                                ? "Estado da instituição é obrigatório."
                                : ""
                        }
                        placeholder="Digite o estado e selecione"
                        selectedValue={selectedEstado}
                        onChange={handleEstadoChange}
                        data-testid="institution-state-input"
                    >
                        Estado
                    </ComboBox>
                ) : (
                    <div>
                        <Spinner />
                    </div>
                )}
                {isMunicipiosSuccess && municipios && selectedEstado ? (
                    <ComboBox
                        data={municipios.map((municipio) => ({
                            id: municipio.id,
                            name: municipio.nome,
                        }))}
                        errorMessage={
                            errors.city
                                ? "Cidade da instituição é obrigatória."
                                : ""
                        }
                        placeholder="Digite a cidade e selecione"
                        selectedValue={selectedMunicipio}
                        onChange={handleMunicipioChange}
                        data-testid="institution-city-input"
                    >
                        Cidade
                    </ComboBox>
                ) : (
                    <Input
                        disabled
                        errorMessage={
                            errors.city
                                ? "Cidade da instituição é obrigatória."
                                : ""
                        }
                        placeholder="Selecione um estado"
                        data-testid="institution-city-input"
                    >
                        Cidade
                    </Input>
                )}
                <Input
                    {...register("address")}
                    type="text"
                    errorMessage={errors.address?.message}
                    placeholder="Rua, número, bairro"
                    data-testid="institution-address-input"
                >
                    Endereço
                </Input>

                <div className="flex gap-2 py-4">
                    <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setIsModalOpen(false)}
                        variant="secondary"
                        data-testid="cancel-btn"
                        className="w-full"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        data-testid="submit-btn"
                        className="w-full"
                    >
                        {needReview ? "Requisitar" : "Atualizar"}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default EditClientForm;
