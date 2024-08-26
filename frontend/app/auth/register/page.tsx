"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import zxcvbn from "zxcvbn";

import {
    useCreateMutation,
    useVerifyPotencialClienteStatusMutation,
} from "@/redux/features/clienteApiSlice";
import {
    useLoginMutation,
    useRegisterMutation,
} from "@/redux/features/authApiSlice";
import { useAppDispatch } from "@/redux/hooks";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";

import { isCNPJ } from "validation-br";
import Image from "next/image";
import prophyIcon from "@/../public/prophy-icon.jpeg";
import { Button, Form, Input } from "@/components/forms";
import { setAuth } from "@/redux/features/authSlice";
import { toast } from "react-toastify";

const Page = () => {
    const [verifyPotencialClienteStatus] =
        useVerifyPotencialClienteStatusMutation();
    const [registerUser] = useRegisterMutation();
    const [login] = useLoginMutation();
    const [createClient] = useCreateMutation();
    const dispatch = useAppDispatch();
    const router = useRouter();

    const checkClientStatus = async (cnpj: string): Promise<boolean> => {
        try {
            const response = await verifyPotencialClienteStatus({
                cnpj,
            }).unwrap();
            return response.approved;
        } catch (error) {
            console.error("Error verifying client status:", error);
            return false;
        }
    };

    const checkPasswordScore = (password: string) => {
        const result = zxcvbn(password);
        return result.score > 2;
    };

    const registerSchema = z
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
            cnpj: z
                .string()
                .length(14, { message: "O CNPJ deve conter 14 caracteres" })
                .refine(isCNPJ, { message: "Digite um CNPJ válido" })
                .refine(checkClientStatus, {
                    message: "Esse CNPJ não foi aprovado pela Equipe Prophy",
                }),
            nome_instituicao: z
                .string()
                .min(1, { message: "Nome da instituição é obrigatório" })
                .max(50, {
                    message:
                        "Nome da instituição não pode exceder 50 caracteres",
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
        })
        .refine((data) => data.password === data.re_password, {
            message: "As senhas não coincidem",
            path: ["re_password"],
        });

    type RegisterFields = z.infer<typeof registerSchema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFields>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit: SubmitHandler<RegisterFields> = async (data) => {
        try {
            const {
                username,
                password,
                re_password,
                cnpj,
                nome_instituicao,
                nome_contato,
                email_contato,
                email_instituicao,
                telefone_instituicao,
                endereco_instituicao,
            } = await registerSchema.parseAsync(data);

            await registerUser({
                username,
                password,
                re_password,
            }).unwrap();

            await login({ username, password });
            dispatch(setAuth());

            await createClient({
                cnpj,
                nome_instituicao,
                nome_contato,
                email_contato,
                email_instituicao,
                telefone_instituicao,
                endereco_instituicao,
            });

            toast.success("O seu cadastro foi realizado com sucesso!");
            router.push("/dashboard");
        } catch (error: any) {
            console.error("Registration error:", error);
            toast.error(
                "Algo deu errado. Por favor, tente novamente. Se o problema continuar, entre em contato conosco."
            );
            return;
        }
    };

    return (
        <main>
            <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <Image
                        className="mx-auto h-10 w-auto"
                        src={prophyIcon}
                        alt="Prophy"
                    />
                    <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                        Cadastre a sua instituição
                    </h2>
                </div>
            </div>
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
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
                        {...register("cnpj")}
                        type="text"
                        errorMessage={errors.cnpj?.message}
                        placeholder="21835755000186"
                    >
                        CNPJ
                    </Input>
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
                    <Button type="submit" disabled={isSubmitting}>
                        Cadastrar
                    </Button>
                </Form>
            </div>
        </main>
    );
};

export default Page;
