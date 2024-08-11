import { useNavigate } from "react-router-dom";

import { z } from "zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import api from "@/server/api";

import AuthResponse from "@/types/auth-response";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants/jwt-token";
import { BASE } from "@/constants/routes";

const loginFieldsSchema = z.object({
    username: z.string().min(1, { message: "O usuário é necessário" }),
    password: z
        .string()
        .min(8, { message: "A senha deve conter no mínimo 8 caracteres" }),
});

type LoginFields = z.infer<typeof loginFieldsSchema>;

const Login = () => {
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFields>({
        resolver: zodResolver(loginFieldsSchema),
    });

    const onSubmit: SubmitHandler<LoginFields> = async (data) => {
        try {
            const response = await api.post<AuthResponse>(
                "/autenticacao/token/",
                { ...data }
            );
            localStorage.setItem(ACCESS_TOKEN, response.data.access);
            localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
            navigate(`/${BASE}/profile`);
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col justify-items-center gap-4 w-1/2 m-auto"
        >
            <input
                {...register("username")}
                type="text"
                placeholder="Usuário"
                className="border"
            />
            {errors.username && (
                <div className="text-red-500">{errors.username.message}</div>
            )}
            <input
                {...register("password")}
                type="password"
                placeholder="Senha"
                className="border"
            />
            {errors.password && (
                <div className="text-red-500">{errors.password.message}</div>
            )}
            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Autenticando..." : "Logar"}
            </button>
        </form>
    );
};

export default Login;
