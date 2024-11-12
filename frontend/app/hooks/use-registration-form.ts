import { useAppDispatch } from "@/redux/hooks";
import { useRouter } from "next/navigation";
import { SubmitHandler } from "react-hook-form";

import {
    useLoginMutation,
    useRegisterMutation,
} from "@/redux/features/authApiSlice";
import { useCreateClientMutation } from "@/redux/features/clientApiSlice";
import { setAuth } from "@/redux/features/authSlice";
import { toast } from "react-toastify";
import {
    RegisterFields,
    registerSchema,
} from "@/components/forms/RegisterForm";

type RegisterFormProps = {
    validatedCNPJ: string;
    setIsModalOpen: (value: boolean) => void;
};

const useRegistrationForm = ({
    validatedCNPJ,
    setIsModalOpen,
}: RegisterFormProps) => {
    const [registerUser] = useRegisterMutation();
    const [login] = useLoginMutation();
    const [createClient] = useCreateClientMutation();
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
                password,
                re_password: rePassword,
            }).unwrap();

            await login({ cpf, password });
            dispatch(setAuth());

            await createClient({
                cnpj: validatedCNPJ,
                name: institutionName,
                email: institutionEmail,
                phone: institutionPhone,
                address,
                state,
                city,
            });

            toast.success("O seu cadastro foi realizado com sucesso!");
            setIsModalOpen(false);
            router.push("/dashboard");
        } catch (error: any) {
            if (error?.status === 400) {
                console.log("useRegistrationForm Error Status 400: ", error);
                toast.info("Um usuário com este CPF já existe.");
                return;
            }
            console.error("useRegistrationForm Error:", error);
            toast.error(
                "Algo deu errado. Por favor, tente novamente. Se o problema continuar, entre em contato conosco."
            );
        }
    };

    return { onSubmit };
};

export default useRegistrationForm;
