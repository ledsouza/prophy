"use client";

import { useEffect, useState } from "react";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { isErrorWithMessages } from "@/redux/services/helpers";
import { closeModal } from "@/redux/features/modalSlice";
import {
    UnitDTO,
    useCreateEditUnitOperationMutation,
    useEditUnitMutation,
} from "@/redux/features/unitApiSlice";

import { useIBGELocalidades, useNeedReview } from "@/hooks";

import { ComboBox, Form, Input, Textarea } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { Button, Spinner } from "@/components/common";
import { unitSchema } from "@/schemas";
import { OperationStatus } from "@/enums";
import { useAppDispatch } from "@/redux/hooks";

export type EditUnitFields = z.infer<typeof unitSchema>;

type EditUnitFormProps = {
    title?: string;
    description?: string;
    disabled?: boolean;
    reviewMode?: boolean;
    unit: UnitDTO;
};

const EditUnitForm = ({
    title,
    description,
    disabled,
    reviewMode,
    unit,
}: EditUnitFormProps) => {
    const dispatch = useAppDispatch();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
    } = useForm<EditUnitFields>({
        resolver: zodResolver(unitSchema),
        defaultValues: {
            name: unit.name,
            cnpj: unit.cnpj,
            email: unit.email,
            phone: unit.phone,
            address: unit.address,
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

    const [isLoadingIBGE, setIsLoadingIBGE] = useState(true);

    const { needReview } = useNeedReview();
    const [isRejected, setIsRejected] = useState(false);

    const [createEditUnitOperation] = useCreateEditUnitOperationMutation();
    const [editUnit] = useEditUnitMutation();

    function isDataUnchanged(
        submittedData: EditUnitFields,
        originalData: UnitDTO
    ) {
        return Object.entries(submittedData).every(
            ([key, value]) =>
                value.toLowerCase() ===
                originalData[key as keyof UnitDTO]?.toString().toLowerCase()
        );
    }

    const onSubmit: SubmitHandler<EditUnitFields> = async (data) => {
        if (isDataUnchanged(data, unit)) {
            toast.warning("Nenhuma alteração foi detectada nos dados.");
            return;
        }

        try {
            const response = needReview
                ? await createEditUnitOperation({
                      ...data,
                      original_unit: unit.id,
                      client: unit.client,
                  })
                : await editUnit({
                      unitID: unit.id,
                      unitData: {
                          ...data,
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
                    placeholder="Digite o nome da unidade"
                    disabled={disabled}
                    data-testid="unit-name-input"
                ></Input>
                <Input
                    {...register("cnpj")}
                    type="text"
                    errorMessage={errors.cnpj?.message}
                    placeholder="Digite o CNPJ da unidade"
                    disabled={disabled}
                    data-testid="unit-cnpj-input"
                >
                    {disabled ? <br /> : "CNPJ"}
                </Input>
                <Input
                    {...register("email")}
                    type="text"
                    errorMessage={errors.email?.message}
                    placeholder="nome@email.com"
                    disabled={disabled}
                    data-testid="unit-email-input"
                >
                    {disabled ? <br /> : "E-mail"}
                </Input>
                <Input
                    {...register("phone")}
                    type="text"
                    errorMessage={errors.phone?.message}
                    placeholder="DD9XXXXXXXX"
                    disabled={disabled}
                    data-testid="unit-phone-input"
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
                        data-testid="unit-state-input"
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
                        data-testid="unit-city-input"
                    >
                        {disabled ? <br /> : "Cidade"}
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
                        data-testid="unit-city-input"
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
                    data-testid="unit-address-input"
                >
                    {disabled ? <br /> : "Endereço"}
                </Input>
            </>
        );
    };

    const renderButtons = () => {
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

    // Load original unit state and city from IBGE API
    useEffect(() => {
        if (isLoadingIBGE) {
            const estado = estados?.find(
                (estado) =>
                    estado.sigla?.toLowerCase() === unit.state.toLowerCase()
            );

            const municipio = municipios?.find(
                (municipio) =>
                    municipio.nome.toLowerCase() === unit.city.toLowerCase()
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
            setIsLoadingIBGE(false);
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

export default EditUnitForm;
