import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useForm } from "react-hook-form";
import useIBGELocalidades from "@/hooks/use-ibge-localidades";
import type { SubmitHandler } from "react-hook-form";

import { Form, Input, ComboBox } from "@/components/forms";
import { Button, Spinner } from "@/components/common";
import { checkPasswordScore } from "@/utils/validation";
import { isCPF } from "validation-br";

export const registerSchema = z
    .object({
        cpf: z
            .string()
            .length(11, { message: "O CPF deve conter 11 caracteres." })
            .refine(isCPF, {
                message:
                    "CPF inválido. Certifique-se de que você digitou todos os 11 dígitos corretamente.",
            }),
        password: z
            .string()
            .min(8, {
                message: "A senha deve conter no mínimo 8 caracteres.",
            })
            .refine((val) => !/^\d+$/.test(val), {
                message: "Evite senhas que contenham apenas números.",
            })
            .refine(checkPasswordScore, {
                message:
                    "Sua senha é muito fraca e coloca sua conta em risco. Por favor, crie uma senha mais forte.",
            }),
        rePassword: z.string().min(8, {
            message:
                "A confirmaçao de senha deve conter no mínimo 8 caracteres.",
        }),
        institutionName: z
            .string()
            .min(1, { message: "Nome da instituição é obrigatório." })
            .max(50, {
                message: "Nome da instituição não pode exceder 50 caracteres.",
            }),
        contactName: z
            .string()
            .min(1, { message: "Nome do contato é obrigatório." })
            .max(50, {
                message: "Nome do contato não pode exceder 50 caracteres.",
            }),
        contactEmail: z
            .string()
            .email({ message: "E-mail do contato inválido." }),
        contactPhone: z.string().length(11, {
            message:
                "O número de celular deve estar no padrão de 11 dígitos (DD9XXXXXXXX).",
        }),
        institutionEmail: z
            .string()
            .email({ message: "E-mail da instituição inválido." }),
        institutionPhone: z
            .string()
            .min(10, { message: "Telefone deve conter no mínimo 10 dígitos." })
            .max(11, { message: "Telefone deve conter no máximo 11 dígitos." })
            .regex(/^\d+$/, {
                message:
                    "Telefone deve conter apenas números com padrão nacional (DD9XXXXXXXX).",
            }),
        address: z
            .string()
            .min(1, { message: "Endereço da instituição é obrigatório." }),
        state: z
            .string()
            .min(1, { message: "Estado da instituição é obrigatório." }),
        city: z
            .string()
            .min(1, { message: "Cidade da instituição é obrigatório." }),
    })
    .refine((data) => data.password === data.rePassword, {
        message: "As senhas não coincidem.",
        path: ["rePassword"],
    });

export type RegisterFields = z.infer<typeof registerSchema>;

type RegisterFormProps = {
    onSubmit: SubmitHandler<RegisterFields>;
    setIsModalOpen: (value: boolean) => void;
};

const RegisterForm = ({ onSubmit, setIsModalOpen }: RegisterFormProps) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
    } = useForm<RegisterFields>({
        resolver: zodResolver(registerSchema),
    });

    const {
        estados,
        isEstadosSuccess,
        selectedEstado,
        handleEstadoChange,
        municipios,
        isMunicipiosSuccess,
        selectedMunicipio,
        handleMunicipioChange,
    } = useIBGELocalidades(setValue);

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <h3 className="text-center text-xl font-bold leading-9 tracking-tight text-gray-900">
                Dados da sua conta
            </h3>
            <Input
                {...register("cpf")}
                type="text"
                errorMessage={errors.cpf?.message}
                placeholder="Digite o seu CPF (apenas dígitos)"
                data-testid="cpf-input"
            >
                CPF
            </Input>
            <Input
                {...register("password")}
                type="password"
                errorMessage={errors.password?.message}
                placeholder="Crie uma senha forte"
                data-testid="password-input"
            >
                Senha
            </Input>
            <Input
                {...register("rePassword")}
                type="password"
                errorMessage={errors.rePassword?.message}
                placeholder="Digite a senha novamente"
                data-testid="repassword-input"
            >
                Confirmação de senha
            </Input>

            <h3 className="text-center text-xl font-bold leading-9 tracking-tight text-gray-900">
                Dados da sua instituição
            </h3>
            <Input
                {...register("institutionName")}
                type="text"
                errorMessage={errors.institutionName?.message}
                placeholder="Digite o nome completo da instituição"
                data-testid="institution-name-input"
            >
                Nome
            </Input>
            <Input
                {...register("institutionEmail")}
                type="text"
                errorMessage={errors.institutionEmail?.message}
                placeholder="nome@email.com"
                data-testid="institution-email-input"
            >
                E-mail
            </Input>
            <Input
                {...register("institutionPhone")}
                type="text"
                errorMessage={errors.institutionPhone?.message}
                placeholder="DD9XXXXXXXX"
                data-testid="institution-phone-input"
            >
                Telefone
            </Input>
            {isEstadosSuccess && estados ? (
                <ComboBox
                    data={estados.map((estado) => ({
                        id: estado.id,
                        name: estado.nome,
                        sigla: estado.sigla,
                    }))}
                    errorMessage={
                        errors.state
                            ? "Estado da instituição é obrigatório."
                            : ""
                    }
                    placeholder="Digite o estado e selecione"
                    selectedValue={selectedEstado}
                    onChange={handleEstadoChange}
                    data-testid="institution-state-input"
                >
                    Estado
                </ComboBox>
            ) : (
                <div>
                    <span>Carregando estados...</span>
                    <Spinner />
                </div>
            )}
            {isMunicipiosSuccess && municipios ? (
                <ComboBox
                    data={municipios.map((municipio) => ({
                        id: municipio.id,
                        name: municipio.nome,
                    }))}
                    errorMessage={
                        errors.city
                            ? "Cidade da instituição é obrigatório."
                            : ""
                    }
                    placeholder="Digite a cidade e selecione"
                    selectedValue={selectedMunicipio}
                    onChange={handleMunicipioChange}
                    data-testid="institution-city-input"
                >
                    Cidade
                </ComboBox>
            ) : (
                <Input
                    disabled
                    errorMessage={
                        errors.city
                            ? "Cidade da instituição é obrigatório."
                            : ""
                    }
                    placeholder="Selecione um estado"
                    data-testid="institution-city-input"
                >
                    Cidade
                </Input>
            )}
            <Input
                {...register("address")}
                type="text"
                errorMessage={errors.address?.message}
                placeholder="Rua, número, bairro"
                data-testid="institution-address-input"
            >
                Endereço
            </Input>

            <h3 className="text-center text-xl font-bold leading-9 tracking-tight text-gray-900">
                Dados de contato
            </h3>
            <Input
                {...register("contactName")}
                type="text"
                errorMessage={errors.contactName?.message}
                placeholder="Digite seu nome completo"
                data-testid="name-input"
            >
                Nome
            </Input>
            <Input
                {...register("contactEmail")}
                type="text"
                errorMessage={errors.contactEmail?.message}
                placeholder="nome@email.com"
                data-testid="email-input"
            >
                E-mail
            </Input>
            <Input
                {...register("contactPhone")}
                type="text"
                errorMessage={errors.contactPhone?.message}
                placeholder="DD9XXXXXXXX"
                data-testid="contact-phone-input"
            >
                Celular
            </Input>
            <div className="flex gap-2 py-4">
                <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsModalOpen(false)}
                    variant="secondary"
                    data-testid="cancel-btn"
                    className="w-full"
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    data-testid="submit-btn"
                    className="w-full"
                >
                    Cadastrar
                </Button>
            </div>
        </Form>
    );
};

export default RegisterForm;
