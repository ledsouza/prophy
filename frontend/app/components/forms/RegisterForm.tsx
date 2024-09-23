import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import zxcvbn from "zxcvbn";

import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";

import { Form, Input, ComboBox } from "@/components/forms";
import { Button, Spinner } from "@/components/common";

import useIBGELocalidades from "@/hooks/use-ibge-localidades";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import { useEffect, useState } from "react";

const checkPasswordScore = (password: string) => {
    const result = zxcvbn(password);
    return result.score > 1;
};

export const registerSchema = z
    .object({
        username: z.string().min(1, { message: "O usuário é necessário" }),
        password: z
            .string()
            .min(8, {
                message: "A senha deve conter no mínimo 8 caracteres",
            })
            .refine(checkPasswordScore, {
                message:
                    "Sua senha é muito fraca e coloca sua conta em risco. Por favor, crie uma senha mais forte.",
            }),
        re_password: z.string().min(8, {
            message:
                "A confirmaçao de senha deve conter no mínimo 8 caracteres",
        }),
        nome_instituicao: z
            .string()
            .min(1, { message: "Nome da instituição é obrigatório" })
            .max(50, {
                message: "Nome da instituição não pode exceder 50 caracteres",
            }),
        nome_contato: z
            .string()
            .min(1, { message: "Nome do contato é obrigatório" })
            .max(50, {
                message: "Nome do contato não pode exceder 50 caracteres",
            }),
        email_contato: z
            .string()
            .email({ message: "E-mail do contato inválido" }),
        email_instituicao: z
            .string()
            .email({ message: "E-mail da instituição inválido" }),
        telefone_instituicao: z
            .string()
            .min(10, { message: "Telefone deve conter no mínimo 10 dígitos." })
            .max(11, { message: "Telefone deve conter no máximo 11 dígitos." })
            .regex(/^\d+$/, {
                message:
                    "Telefone deve conter apenas números com padrão nacional (DD9XXXXXXXX).",
            }),
        endereco_instituicao: z
            .string()
            .min(1, { message: "Endereço da instituição é obrigatório." }),
        estado_instituicao: z
            .string()
            .min(1, { message: "Estado da instituição é obrigatório." }),
        cidade_instituicao: z
            .string()
            .min(1, { message: "Cidade da instituição é obrigatório." }),
    })
    .refine((data) => data.password === data.re_password, {
        message: "As senhas não coincidem",
        path: ["re_password"],
    });

export type RegisterFields = z.infer<typeof registerSchema>;

type RegisterFormProps = {
    onSubmit: SubmitHandler<RegisterFields>;
    setIsModalOpen: (value: boolean) => void;
};

const RegisterForm = ({ onSubmit, setIsModalOpen }: RegisterFormProps) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
    } = useForm<RegisterFields>({
        resolver: zodResolver(registerSchema),
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

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <h3 className="text-center text-xl font-bold leading-9 tracking-tight text-gray-900">
                Dados da sua conta
            </h3>
            <Input
                {...register("username")}
                type="text"
                errorMessage={errors.username?.message}
                placeholder="Nome de usuário"
                data-testid="username-input"
            >
                Usuário
            </Input>
            <Input
                {...register("password")}
                type="password"
                errorMessage={errors.password?.message}
                placeholder="Crie uma senha forte"
                data-testid="password-input"
            >
                Senha
            </Input>
            <Input
                {...register("re_password")}
                type="password"
                errorMessage={errors.re_password?.message}
                placeholder="Digite a senha novamente"
                data-testid="repassword-input"
            >
                Confirmação de senha
            </Input>
            <h3 className="text-center text-xl font-bold leading-9 tracking-tight text-gray-900">
                Dados da sua instituição
            </h3>
            <Input
                {...register("nome_instituicao")}
                type="text"
                errorMessage={errors.nome_instituicao?.message}
                placeholder="Digite o nome completo da instituição"
                data-testid="institution-name-input"
            >
                Nome
            </Input>
            <Input
                {...register("email_instituicao")}
                type="text"
                errorMessage={errors.email_instituicao?.message}
                placeholder="nome@email.com"
                data-testid="institution-email-input"
            >
                E-mail
            </Input>
            <Input
                {...register("telefone_instituicao")}
                type="text"
                errorMessage={errors.telefone_instituicao?.message}
                placeholder="Apenas números no padrão nacional (51983357247)"
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
                        errors.estado_instituicao
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
                    <span>Carregando estados...</span>
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
                        errors.cidade_instituicao
                            ? "Cidade da instituição é obrigatório."
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
                        errors.cidade_instituicao
                            ? "Cidade da instituição é obrigatório."
                            : ""
                    }
                    placeholder="Selecione um estado"
                    data-testid="institution-city-input"
                >
                    Cidade
                </Input>
            )}
            <Input
                {...register("endereco_instituicao")}
                type="text"
                errorMessage={errors.endereco_instituicao?.message}
                placeholder="Rua, número, bairro"
                data-testid="institution-address-input"
            >
                Endereço
            </Input>
            <h3 className="text-center text-xl font-bold leading-9 tracking-tight text-gray-900">
                Dados de contato
            </h3>
            <Input
                {...register("nome_contato")}
                type="text"
                errorMessage={errors.nome_contato?.message}
                placeholder="Digite seu nome completo"
                data-testid="name-input"
            >
                Nome
            </Input>
            <Input
                {...register("email_contato")}
                type="text"
                errorMessage={errors.email_contato?.message}
                placeholder="nome@email.com"
                data-testid="email-input"
            >
                E-mail
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
                    Cadastrar
                </Button>
            </div>
        </Form>
    );
};

export default RegisterForm;
