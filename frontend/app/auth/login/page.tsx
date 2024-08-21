"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/redux/hooks";
import { useLoginMutation } from "@/redux/features/authApiSlice";
import { setAuth } from "@/redux/features/authSlice";
import { toast } from "react-toastify";
import { Form } from "@/components/forms";

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
            toast.error("Houve uma falha no login");
        }
    };

    return (
        <main>
            <Form></Form>
        </main>
    );
}
