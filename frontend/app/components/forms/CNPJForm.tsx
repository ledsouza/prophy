import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isCNPJ } from "validation-br";

import { Button, Form, Input } from "@/components/forms";
import { useForm, SubmitHandler } from "react-hook-form";

import Image from "next/image";
import prophyIcon from "@/../public/prophy-icon.jpeg";

const cnpjSchema = z.object({
    cnpj: z
        .string()
        .length(14, { message: "O CNPJ deve conter 14 caracteres" })
        .refine(isCNPJ, { message: "Digite um CNPJ válido" }),
});

type CNPJFields = z.infer<typeof cnpjSchema>;

type CNPJFormProps = {
    onSubmit: (cnpj: string) => void;
};

const CNPJForm: React.FC<CNPJFormProps> = ({ onSubmit }) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<CNPJFields>({
        resolver: zodResolver(cnpjSchema),
    });

    const handleCNPJSubmit: SubmitHandler<CNPJFields> = async (data) => {
        const { cnpj } = data;
        onSubmit(cnpj);
    };

    return (
        <>
            <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-2">
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <Image
                        className="mx-auto h-10 w-auto"
                        src={prophyIcon}
                        alt="Prophy"
                    />
                    <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                        Insira o CNPJ da sua instituição
                    </h2>
                    <p className="text-center text-xl leading-9 tracking-tight text-gray-900">
                        Para prosseguir com o cadastro da sua instituição, é
                        necessário que o seu CNPJ esteja validado.
                    </p>
                </div>
            </div>
            <Form onSubmit={handleSubmit(handleCNPJSubmit)}>
                <Input
                    {...register("cnpj")}
                    type="text"
                    errorMessage={errors.cnpj?.message}
                    placeholder="21835755000186"
                >
                    CNPJ
                </Input>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Verificando..." : "Verificar CNPJ"}
                </Button>
            </Form>
        </>
    );
};

export default CNPJForm;
