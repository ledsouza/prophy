"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useRouter } from "next/navigation";
import { useLoginMutation } from "@/redux/features/authApiSlice";
import { setAuth } from "@/redux/features/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";

import { Form, HeaderForm, Input } from "@/components/forms";
import { Button } from "@/components/common";

import { toast } from "react-toastify";
import prophyIcon from "@/../public/images/prophy-icon.png";

const loginFieldsSchema = z.object({
    cpf: z.string().min(1, { message: "O CPF é necessário" }),
    password: z
        .string()
        .min(8, { message: "A senha deve conter no mínimo 8 caracteres" }),
});

type LoginFields = z.infer<typeof loginFieldsSchema>;

const LoginForm = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFields>({
        resolver: zodResolver(loginFieldsSchema),
    });
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [login] = useLoginMutation();

    const onSubmit: SubmitHandler<LoginFields> = async (data) => {
        try {
            await login({ ...data }).unwrap();
            dispatch(setAuth());
            toast.success("Você está autenticado!");
            router.push("/dashboard");
        } catch (error) {
            toast.error(
                "Houve uma falha ao acessar sua conta. Verifique se o CPF e senha estão corretos"
            );
        }
    };

    return (
        <>
            <HeaderForm
                src={prophyIcon}
                alt="Icone da Prophy"
                title="Acesse a sua conta"
            />
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Input
                        {...register("cpf")}
                        type="text"
                        errorMessage={errors.cpf?.message}
                        data-testid="cpf-input"
                        placeholder="86453108054"
                    >
                        CPF
                    </Input>
                    <Input
                        {...register("password")}
                        type="password"
                        errorMessage={errors.password?.message}
                        data-testid="password-input"
                        placeholder="Digite a sua senha"
                    >
                        Senha
                    </Input>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        data-testid="submit-button"
                        className="w-full"
                    >
                        Acessar
                    </Button>
                </Form>
            </div>
        </>
    );
};

export default LoginForm;
