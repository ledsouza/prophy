"use client";

import { useEffect, useState } from "react";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { isErrorWithMessages } from "@/redux/services/helpers";
import {
    UnitDTO,
    useCreateEditUnitOperationMutation,
} from "@/redux/features/unitApiSlice";

import { useIBGELocalidades } from "@/hooks";

import { ComboBox, Form, Input } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { Button, Spinner } from "@/components/common";
import { unitSchema } from "@/schemas";

export type EditUnitFields = z.infer<typeof unitSchema>;

type EditUnitFormProps = {
    originalUnit: UnitDTO;
    setIsModalOpen: (value: boolean) => void;
};

const EditUnitForm = ({ originalUnit, setIsModalOpen }: EditUnitFormProps) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
    } = useForm<EditUnitFields>({
        resolver: zodResolver(unitSchema),
        defaultValues: {
            name: originalUnit.name,
            cnpj: originalUnit.cnpj,
            email: originalUnit.email,
            phone: originalUnit.phone,
            address: originalUnit.address,
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
    const [createEditUnitOperation] = useCreateEditUnitOperationMutation();

    const onSubmit: SubmitHandler<EditUnitFields> = async (data) => {
        if (
            Object.entries(data).every(
                ([key, value]) =>
                    value.toLowerCase() ===
                    originalUnit[key as keyof UnitDTO]?.toString().toLowerCase()
            )
        ) {
            toast.warning("Nenhuma alteração foi detectada nos dados.");
            return;
        }

        try {
            const response = await createEditUnitOperation({
                ...data,
                original_unit: originalUnit.id,
                client: originalUnit.client,
            });

            if (response.error) {
                if (isErrorWithMessages(response.error)) {
                    toast.error(response.error.data.messages[0]);
                    return;
                }
            }

            toast.success("Requisição enviada com sucesso!");
            setIsModalOpen(false);
        } catch (error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }
    };

    // Load original unit state and city from IBGE API
    useEffect(() => {
        if (isLoadingIBGE) {
            const estado = estados?.find(
                (estado) =>
                    estado.sigla?.toLowerCase() ===
                    originalUnit.state.toLowerCase()
            );

            const municipio = municipios?.find(
                (municipio) =>
                    municipio.nome.toLowerCase() ===
                    originalUnit.city.toLowerCase()
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
                    placeholder="Digite o nome da unidade"
                    data-testid="unit-name-input"
                >
                    Nome
                </Input>
                <Input
                    {...register("cnpj")}
                    type="text"
                    errorMessage={errors.cnpj?.message}
                    placeholder="Digite o CNPJ da unidade"
                    data-testid="unit-cnpj-input"
                >
                    CNPJ
                </Input>
                <Input
                    {...register("email")}
                    type="text"
                    errorMessage={errors.email?.message}
                    placeholder="nome@email.com"
                    data-testid="unit-email-input"
                >
                    E-mail
                </Input>
                <Input
                    {...register("phone")}
                    type="text"
                    errorMessage={errors.phone?.message}
                    placeholder="DD9XXXXXXXX"
                    data-testid="unit-phone-input"
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
                        data-testid="unit-state-input"
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
                        data-testid="unit-city-input"
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
                        data-testid="unit-city-input"
                    >
                        Cidade
                    </Input>
                )}
                <Input
                    {...register("address")}
                    type="text"
                    errorMessage={errors.address?.message}
                    placeholder="Rua, número, bairro"
                    data-testid="unit-address-input"
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
                        Requisitar
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default EditUnitForm;
