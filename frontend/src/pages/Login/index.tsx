// React and Router
import { Navigate, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";

// Form and Validation
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Data fetching and utilities
import axios from "axios";

// Project specifics
import api from "@/server/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants/jwt-token";
import { BASE } from "@/constants/routes";
import { AuthContext, AuthContextType } from "@/contexts/AuthContext";

type APIResponse = {
    access: string;
    refresh: string;
};

type ErrorResponse = {
    detail: string;
};

const loginFieldsSchema = z.object({
    username: z.string().min(1, { message: "O usuário é necessário" }),
    password: z
        .string()
        .min(8, { message: "A senha deve conter no mínimo 8 caracteres" }),
});

type LoginFields = z.infer<typeof loginFieldsSchema>;

const Login = () => {
    const navigate = useNavigate();

    const { isAuthenticated, setIsAuthenticated } = useContext(
        AuthContext
    ) as AuthContextType;
    const [loginError, setLoginError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFields>({
        resolver: zodResolver(loginFieldsSchema),
    });

    const onSubmit: SubmitHandler<LoginFields> = async (data) => {
        try {
            const response = await api.post<APIResponse>(
                "/autenticacao/token/",
                { ...data }
            );
            localStorage.setItem(ACCESS_TOKEN, response.data.access);
            localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
            setIsAuthenticated(true);
            navigate(`${BASE}profile`);
        } catch (error) {
            if (axios.isAxiosError<ErrorResponse>(error) && error.response) {
                if (error.response.status === 401) {
                    setLoginError(error.response.data.detail);
                } else {
                    console.error("API Error:", error.response.data);
                }
            }
        }
    };

    if (isAuthenticated) {
        return <Navigate to={`${BASE}profile`} />;
    }

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
            {loginError && (
                <div className="text-red-500 mx-auto">{loginError}</div>
            )}
        </form>
    );
};

export default Login;
