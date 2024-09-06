import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import zxcvbn from "zxcvbn";

import { Button, Form, Input } from "@/components/forms";
import { useForm, SubmitHandler } from "react-hook-form";

import { brStates } from "@/constants";
import ComboBox, { ComboboxDataProps } from "./ComboBox";
import { useEffect, useState } from "react";
import { useGetEstadosQuery } from "@/redux/services/ibgeApiSlice";

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
                    "Sua senha não pode ser muito parecida com o resto das suas informações pessoais ou ser uma senha comumente utilizada. Use uma combinação de letras maiúsculas e minúsculas, números e símbolos.",
            })
            .refine((password) => !/^\d+$/.test(password), {
                message: "A senha não pode conter apenas números.",
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
            .length(11, { message: "Telefone deve conter 11 dígitos." })
            .regex(/^\d+$/, {
                message: "Telefone deve conter apenas números.",
            }),
        endereco_instituicao: z
            .string()
            .min(1, { message: "Endereço da instituição é obrigatório." }),
        estado_instituicao: z
            .string()
            .min(2, { message: "Estado da instituição é obrigatório." })
            .max(2, {
                message: "Estado da instituição inválido.",
            }),
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

const RegisterForm: React.FC<RegisterFormProps> = ({
    onSubmit,
    setIsModalOpen,
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
    } = useForm<RegisterFields>({
        resolver: zodResolver(registerSchema),
    });

    const [selectedState, setSelectedState] =
        useState<ComboboxDataProps | null>(null);

    const handleStateChange = (selectedState: ComboboxDataProps | null) => {
        setSelectedState(selectedState);
        setValue("estado_instituicao", selectedState?.id || "");
    };

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
            >
                Usuário
            </Input>
            <Input
                {...register("password")}
                type="password"
                errorMessage={errors.password?.message}
                placeholder="Crie uma senha forte"
            >
                Senha
            </Input>
            <Input
                {...register("re_password")}
                type="password"
                errorMessage={errors.re_password?.message}
                placeholder="Digite a senha novamente"
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
            >
                Nome
            </Input>
            <Input
                {...register("email_instituicao")}
                type="text"
                errorMessage={errors.email_instituicao?.message}
                placeholder="nome@email.com"
            >
                E-mail
            </Input>
            <Input
                {...register("telefone_instituicao")}
                type="text"
                errorMessage={errors.telefone_instituicao?.message}
                placeholder="51993859324"
            >
                Telefone
            </Input>
            <Input
                {...register("endereco_instituicao")}
                type="text"
                errorMessage={errors.endereco_instituicao?.message}
                placeholder="Rua, número, bairro"
            >
                Endereço
            </Input>
            <ComboBox
                data={brStates}
                placeholder="Digite o estado"
                selectedValue={selectedState}
                onChange={handleStateChange}
            >
                Estado
            </ComboBox>
            {/* <Input
                {...register("estado_instituicao")}
                type="text"
                errorMessage={errors.estado_instituicao?.message}
                placeholder="SP"
            >
                Estado
            </Input> */}
            <Input
                {...register("cidade_instituicao")}
                type="text"
                errorMessage={errors.cidade_instituicao?.message}
                placeholder="São Paulo"
            >
                Cidade
            </Input>
            <h3 className="text-center text-xl font-bold leading-9 tracking-tight text-gray-900">
                Dados de contato
            </h3>
            <Input
                {...register("nome_contato")}
                type="text"
                errorMessage={errors.nome_contato?.message}
                placeholder="Digite seu nome completo"
            >
                Nome
            </Input>
            <Input
                {...register("email_contato")}
                type="text"
                errorMessage={errors.email_contato?.message}
                placeholder="nome@email.com"
            >
                E-mail
            </Input>
            <div className="gap-2 sm:flex sm:flex-row-reverse sm:px-6">
                <Button type="submit" disabled={isSubmitting}>
                    Cadastrar
                </Button>
                <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsModalOpen(false)}
                    variant="secondary"
                >
                    Cancelar
                </Button>
            </div>
        </Form>
    );
};

export default RegisterForm;
