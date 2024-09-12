import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isCNPJ } from "validation-br";

import { Button, Form, HeaderForm, Input } from "@/components/forms";
import { useForm, SubmitHandler } from "react-hook-form";

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
            <HeaderForm
                src={prophyIcon}
                alt="Icone da Prophy"
                title="Insira o CNPJ da sua instituição"
                subtitle="Para prosseguir com o cadastro da sua instituição, é
                        necessário que o seu CNPJ esteja validado."
            />
            <Form onSubmit={handleSubmit(handleCNPJSubmit)}>
                <Input
                    {...register("cnpj")}
                    type="text"
                    errorMessage={errors.cnpj?.message}
                    placeholder="21835755000186"
                    data-testid="input-cnpj"
                >
                    CNPJ
                </Input>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    data-testid="button-submit"
                >
                    {isSubmitting ? "Verificando..." : "Verificar CNPJ"}
                </Button>
            </Form>
        </>
    );
};

export default CNPJForm;
