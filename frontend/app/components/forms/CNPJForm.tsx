"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isCNPJ } from "validation-br";

import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";

import { Form, HeaderForm, Input } from "@/components/forms";
import { Button } from "@/components/common";

import prophyIcon from "@/../public/images/prophy-icon.png";
import { getClienteByCnpj } from "@/redux/services/apiSlice";

const cnpjSchema = z.object({
    cnpj: z
        .string()
        .length(14, { message: "O CNPJ deve conter 14 caracteres." })
        .refine(isCNPJ, {
            message:
                "CNPJ inválido. Certifique-se de que você digitou todos os 14 dígitos corretamente.",
        })
        .refine(
            async (submittedCnpj) => {
                const data = await getClienteByCnpj(submittedCnpj);
                return data.length === 0;
            },
            { message: "Este CNPJ já está cadastrado." }
        ),
});

type CNPJFields = z.infer<typeof cnpjSchema>;

type CNPJFormProps = {
    onSubmit: (cnpj: string) => void;
};

const CNPJForm = ({ onSubmit }: CNPJFormProps) => {
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
                    className="w-full"
                >
                    {isSubmitting ? "Verificando..." : "Verificar CNPJ"}
                </Button>
            </Form>
        </>
    );
};

export default CNPJForm;
