"use client";

import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import { clientSchema } from "@/schemas";
import { OperationStatus } from "@/enums";

import {
    ClientDTO,
    useCreateEditClientOperationMutation,
    useEditClientMutation,
} from "@/redux/features/clientApiSlice";
import { isErrorWithMessages } from "@/redux/services/helpers";

import { useIBGELocalidades, useNeedReview } from "@/hooks";

import { Typography } from "@/components/foundation";
import { Button, Spinner } from "@/components/common";
import { ComboBox, Form, Input, Textarea } from "@/components/forms";
import { useAppDispatch } from "@/redux/hooks";
import { closeModal } from "@/redux/features/modalSlice";

const editClientSchema = clientSchema;

export type EditClientFields = z.infer<typeof editClientSchema>;

type EditClientProps = {
    title?: string;
    description?: string;
    disabled?: boolean;
    reviewMode?: boolean;
    client: ClientDTO;
};

const EditClientForm = ({
    title,
    description,
    disabled = false,
    reviewMode = false,
    client,
}: EditClientProps) => {
    const dispatch = useAppDispatch();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
    } = useForm<EditClientFields>({
        resolver: zodResolver(editClientSchema),
        defaultValues: {
            name: client.name,
            email: client.email,
            phone: client.phone,
            address: client.address,
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

    const { needReview } = useNeedReview();

    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [isRejected, setIsRejected] = useState(false);

    const [createEditClientOperation] = useCreateEditClientOperationMutation();
    const [editClient] = useEditClientMutation();

    const isDataUnchanged = (
        editData: Omit<EditClientFields, "note">,
        client: Omit<ClientDTO, "users" | "id">
    ): boolean => {
        return Object.keys(editData).every(
            (key) =>
                editData[
                    key as keyof Omit<EditClientFields, "note">
                ].toLowerCase() ===
                client[
                    key as keyof Omit<ClientDTO, "users" | "id">
                ].toLowerCase()
        );
    };

    const onSubmit: SubmitHandler<EditClientFields> = async (editData) => {
        if (!reviewMode && isDataUnchanged(editData, client)) {
            toast.warning("Nenhuma alteração foi detectada nos dados.");
            return;
        }

        try {
            const response = needReview
                ? await createEditClientOperation({
                      ...editData,
                      cnpj: client.cnpj,
                      original_client: client.id,
                  })
                : await editClient({
                      clientID: client.id,
                      clientData: {
                          ...editData,
                          operation_status: isRejected
                              ? OperationStatus.REJECTED
                              : OperationStatus.ACCEPTED,
                      },
                  });

            if (response.error) {
                if (isErrorWithMessages(response.error)) {
                    throw new Error(response.error.data.messages[0]);
                }
                throw new Error("Um erro inesperado ocorreu.");
            }

            // If review is not required, the user is either an internal medical physicist or a Prophy manager.
            // The user may be editing information or reviewing an operation.
            // If `isRejected` is false, the user accepted the operation or updated some information.
            let successMessage;
            if (!needReview) {
                successMessage = isRejected
                    ? "Revisão concluída! O cliente será notificado da rejeição."
                    : "Dados atualizados com sucesso!";
            }
            toast.success(successMessage);
            dispatch(closeModal());
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Algo deu errado. Tente novamente mais tarde."
            );
        }
    };

    const renderInputs = () => {
        // If in rejection note step, show only the note input
        if (isRejected) {
            return (
                <Textarea
                    {...register("note")}
                    rows={18}
                    errorMessage={errors.note?.message}
                    placeholder="Justifique o motivo da rejeição"
                    data-testid="rejection-note-input"
                ></Textarea>
            );
        }

        return (
            <>
                <Input
                    {...register("name")}
                    type="text"
                    errorMessage={errors.name?.message}
                    placeholder="Digite o nome completo da instituição"
                    disabled={disabled}
                    data-testid="institution-name-input"
                >
                    {disabled ? <br /> : "Nome"}
                </Input>
                <Input
                    {...register("email")}
                    type="text"
                    errorMessage={errors.email?.message}
                    placeholder="nome@email.com"
                    disabled={disabled}
                    data-testid="institution-email-input"
                >
                    {disabled ? <br /> : "E-mail"}
                </Input>
                <Input
                    {...register("phone")}
                    type="text"
                    errorMessage={errors.phone?.message}
                    placeholder="DD9XXXXXXXX"
                    disabled={disabled}
                    data-testid="institution-phone-input"
                >
                    {disabled ? <br /> : "Telefone"}
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
                        disabled={disabled}
                        data-testid="institution-state-input"
                    >
                        {disabled ? <br /> : "Estado"}
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
                        disabled={disabled}
                        data-testid="institution-city-input"
                    >
                        {disabled ? <br /> : "Endereço"}
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
                        {disabled ? <br /> : "Cidade"}
                    </Input>
                )}
                <Input
                    {...register("address")}
                    type="text"
                    errorMessage={errors.address?.message}
                    placeholder="Rua, número, bairro"
                    disabled={disabled}
                    data-testid="institution-address-input"
                >
                    {disabled ? <br /> : "Endereço"}
                </Input>
            </>
        );
    };

    // Render buttons based on current state
    const renderButtons = () => {
        // Rejection note step
        if (isRejected) {
            return (
                <div className="flex gap-2 py-4">
                    <Button
                        type="button"
                        onClick={() => setIsRejected(false)}
                        variant="secondary"
                        className="w-full"
                        data-testid="back-btn"
                    >
                        Voltar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        data-testid="submit-rejection-btn"
                        className="w-full"
                    >
                        Enviar
                    </Button>
                </div>
            );
        }

        // Review mode buttons
        if (!disabled && reviewMode) {
            return (
                <div className="flex gap-2 py-4">
                    <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => {
                            setIsRejected(true);
                        }}
                        variant="danger"
                        className="w-full"
                        data-testid="reject-btn"
                    >
                        Rejeitar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        data-testid="submit-btn"
                        className="w-full"
                    >
                        Aceitar
                    </Button>
                </div>
            );
        }

        if (disabled) {
            return <br />;
        }

        // Default buttons (if not in review mode)
        return (
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
                    {needReview ? "Requisitar" : "Atualizar"}
                </Button>
            </div>
        );
    };

    useEffect(() => {
        if (isInitialLoad) {
            const estado = estados?.find(
                (estado) =>
                    estado.sigla?.toLowerCase() === client.state.toLowerCase()
            );

            const municipio = municipios?.find(
                (municipio) =>
                    municipio.nome.toLowerCase() === client.city.toLowerCase()
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

    useEffect(() => {
        if (!isRejected) {
            setValue("note", undefined);
        }
    }, [isRejected]);

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            <Form onSubmit={handleSubmit(onSubmit)}>
                {!isRejected ? (
                    <>
                        <Typography
                            element="h3"
                            size="title3"
                            className="font-semibold"
                        >
                            {title}
                        </Typography>
                        <Typography
                            element="p"
                            size="md"
                            className="text-justify"
                        >
                            {description}
                        </Typography>
                    </>
                ) : (
                    <Typography
                        element="h3"
                        size="title3"
                        className="font-semibold"
                    >
                        Por favor, justifique o motivo da rejeição
                    </Typography>
                )}

                {renderInputs()}
                {renderButtons()}
            </Form>
        </div>
    );
};

export default EditClientForm;
