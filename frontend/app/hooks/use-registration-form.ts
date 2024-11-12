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
                re_password,
                nome_instituicao,
                nome_contato,
                email_contato,
                email_instituicao,
                telefone_instituicao,
                endereco_instituicao,
                estado_instituicao,
                cidade_instituicao,
            } = registerSchema.parse(data);

            await registerUser({
                cpf,
                email: email_contato,
                name: nome_contato,
                password,
                re_password,
            }).unwrap();

            await login({ cpf, password });
            dispatch(setAuth());

            await createClient({
                cnpj: validatedCNPJ,
                nome_instituicao,
                nome_contato,
                email_contato,
                email_instituicao,
                telefone_instituicao,
                endereco_instituicao,
                estado_instituicao,
                cidade_instituicao,
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
