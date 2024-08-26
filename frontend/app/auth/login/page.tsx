"use client";

import Image from "next/image";
import { SubmitHandler, useForm } from "react-hook-form";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/redux/hooks";
import { useLoginMutation } from "@/redux/features/authApiSlice";
import { setAuth } from "@/redux/features/authSlice";

import { toast } from "react-toastify";

import { Button, Form, Input } from "@/components/forms";
import prophyIcon from "@/../public/prophy-icon.jpeg";

const loginFieldsSchema = z.object({
    username: z.string().min(1, { message: "O usuário é necessário" }),
    password: z
        .string()
        .min(8, { message: "A senha deve conter no mínimo 8 caracteres" }),
});

type LoginFields = z.infer<typeof loginFieldsSchema>;

export default function Page() {
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
        <main>
            <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <Image
                        className="mx-auto h-10 w-auto"
                        src={prophyIcon}
                        alt="Prophy"
                    />
                    <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                        Acesse a sua conta
                    </h2>
                </div>
            </div>
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
        </main>
    );
}
