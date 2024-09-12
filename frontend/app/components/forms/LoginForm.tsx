"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useRouter } from "next/navigation";
import { useLoginMutation } from "@/redux/features/authApiSlice";
import { setAuth } from "@/redux/features/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import { SubmitHandler, useForm } from "react-hook-form";

import HeaderForm from "./HeaderForm";

import { toast } from "react-toastify";
import prophyIcon from "@/../public/prophy-icon.jpeg";
import Form from "./Form";
import Input from "./Input";
import Button from "./Button";

const loginFieldsSchema = z.object({
    username: z.string().min(1, { message: "O usuário é necessário" }),
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
                "Houve uma falha ao acessar sua conta. Verifique se o usuário e senha estão corretos"
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
                        {...register("username")}
                        type="text"
                        errorMessage={errors.username?.message}
                    >
                        Usuário
                    </Input>
                    <Input
                        {...register("password")}
                        type="password"
                        errorMessage={errors.password?.message}
                    >
                        Senha
                    </Input>
                    <Button type="submit" disabled={isSubmitting}>
                        Acessar
                    </Button>
                </Form>
            </div>
        </>
    );
};

export default LoginForm;
