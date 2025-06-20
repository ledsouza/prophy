"use client";

import { useRouter } from "next/navigation";
import { SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";

import { useAppDispatch } from "@/redux/hooks";
import { useLoginMutation, useRegisterMutation } from "@/redux/features/authApiSlice";
import { useCreateClientMutation } from "@/redux/features/clientApiSlice";
import { useCreateUnitMutation } from "@/redux/features/unitApiSlice";
import { setAuth } from "@/redux/features/authSlice";

import { RegisterFields } from "@/components/forms/RegisterForm";
import { registerSchema } from "@/schemas";

type RegisterFormProps = {
    validatedCNPJ: string;
    setIsModalOpen: (value: boolean) => void;
};

const useRegistrationForm = ({ validatedCNPJ, setIsModalOpen }: RegisterFormProps) => {
    const [registerUser] = useRegisterMutation();
    const [login] = useLoginMutation();
    const [createClient] = useCreateClientMutation();
    const [createUnit] = useCreateUnitMutation();

    const dispatch = useAppDispatch();
    const router = useRouter();

    const onSubmit: SubmitHandler<RegisterFields> = async (data) => {
        try {
            const {
                cpf,
                password,
                rePassword,
                institutionName,
                contactName,
                contactEmail,
                contactPhone,
                institutionEmail,
                institutionPhone,
                address,
                state,
                city,
            } = registerSchema.parse(data);

            await registerUser({
                cpf,
                email: contactEmail,
                name: contactName,
                phone: contactPhone,
                password,
                re_password: rePassword,
            }).unwrap();

            await login({ cpf, password });
            dispatch(setAuth());

            const clientResponse = await createClient({
                cnpj: validatedCNPJ,
                name: institutionName,
                email: institutionEmail,
                phone: institutionPhone,
                address,
                state,
                city,
            });

            if (!clientResponse.error) {
                await createUnit({
                    cnpj: validatedCNPJ,
                    name: institutionName,
                    email: institutionEmail,
                    phone: institutionPhone,
                    address,
                    state,
                    city,
                    client: clientResponse.data?.id,
                });
            }

            toast.success("O seu cadastro foi realizado com sucesso!");
            setIsModalOpen(false);
            router.push("/dashboard");
        } catch (error: any) {
            if (error?.status === 400) {
                toast.info("Um usuário com este CPF já existe.");
                return;
            }
            toast.error(
                "Algo deu errado. Por favor, tente novamente. Se o problema continuar, entre em contato conosco."
            );
        }
    };

    return { onSubmit };
};

export default useRegistrationForm;
