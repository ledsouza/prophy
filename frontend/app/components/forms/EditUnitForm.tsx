"use client";

import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isCNPJ } from "validation-br";
import { toast } from "react-toastify";

import { isErrorWithMessages } from "@/redux/services/helpers";
import { UnitDTO, useCreateUnitMutation } from "@/redux/features/unitApiSlice";

import { useIBGELocalidades } from "@/hooks";
import { OperationStatus, OperationType } from "@/enums";

import { ComboBox, Form, Input } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { Button, Spinner } from "@/components/common";

const editUnitSchema = z.object({
    name: z
        .string()
        .nonempty({ message: "Nome é obrigatório." })
        .max(50, { message: "Nome deve ter no máximo 50 caracteres." }),
    cnpj: z
        .string()
        .nonempty({ message: "CNPJ é obrigatório." })
        .length(14, { message: "CNPJ deve ter 14 caracteres." })
        .refine((cnpj) => isCNPJ(cnpj), { message: "CNPJ inválido." }),
    email: z
        .string()
        .nonempty({ message: "E-mail é obrigatório." })
        .email({ message: "E-mail inválido." }),
    phone: z
        .string()
        .nonempty({ message: "Telefone é obrigatório." })
        .min(10, { message: "Telefone deve conter no mínimo 10 dígitos." })
        .max(11, { message: "Telefone deve conter no máximo 11 dígitos." })
        .regex(/^[0-9]+$/, { message: "Telefone deve conter apenas números." }),
    address: z
        .string()
        .nonempty({ message: "Endereço é obrigatório." })
        .max(150, { message: "Endereço deve ter no máximo 150 caracteres." }),
    state: z.string().nonempty({ message: "Estado é obrigatório." }),
    city: z.string().nonempty({ message: "Cidade é obrigatória." }),
});

export type EditUnitFields = z.infer<typeof editUnitSchema>;

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
        resolver: zodResolver(editUnitSchema),
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
    const [requestEditUnit] = useCreateUnitMutation();

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
            const response = await requestEditUnit({
                ...data,
                original_unit: originalUnit.id,
                client: originalUnit.client,
                operation_status: OperationStatus.REVIEW,
                operation_type: OperationType.EDIT,
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
                {isMunicipiosSuccess && municipios ? (
                    <ComboBox
                        data={municipios.map((municipio) => ({
                            id: municipio.id,
                            name: municipio.nome,
                        }))}
                        errorMessage={
                            errors.state
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
                            errors.state
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
