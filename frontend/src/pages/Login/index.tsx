import { z } from "zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const loginFieldsSchema = z.object({
    username: z.string().min(1, { message: "O usuário é necessário" }),
    password: z
        .string()
        .min(8, { message: "A senha deve conter no mínimo 8 caracteres" }),
});

type LoginFields = z.infer<typeof loginFieldsSchema>;

const Login = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFields>({
        resolver: zodResolver(loginFieldsSchema),
    });

    const onSubmit: SubmitHandler<LoginFields> = async (data) => {
        try {
            console.log(data);
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
            <button type="submit">Logar</button>
        </form>
    );
};

export default Login;
