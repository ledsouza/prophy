"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useForm, SubmitHandler } from "react-hook-form";
import useIBGELocalidades from "@/hooks/use-ibge-localidades";

import { Form, Input, ComboBox } from "@/components/forms";
import { Button, Spinner } from "@/components/common";
import { registerSchema } from "@/schemas";

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
                dataCy="register-cpf-input"
                dataTestId="cpf-input"
                label="CPF"
            />
            <Input
                {...register("password")}
                type="password"
                errorMessage={errors.password?.message}
                placeholder="Crie uma senha forte"
                dataCy="register-password-input"
                dataTestId="password-input"
                label="Senha"
            />
            <Input
                {...register("rePassword")}
                type="password"
                errorMessage={errors.rePassword?.message}
                placeholder="Digite a senha novamente"
                dataCy="register-password-confirm-input"
                dataTestId="repassword-input"
                label="Confirmação de senha"
            />

            <h3 className="text-center text-xl font-bold leading-9 tracking-tight text-gray-900">
                Dados da sua instituição
            </h3>
            <Input
                {...register("institutionName")}
                type="text"
                errorMessage={errors.institutionName?.message}
                placeholder="Digite o nome completo da instituição"
                dataCy="register-institution-name-input"
                dataTestId="institution-name-input"
                label="Nome"
            />
            <Input
                {...register("institutionRazaoSocial")}
                type="text"
                errorMessage={errors.institutionRazaoSocial?.message}
                placeholder="Digite a razão social da instituição"
                dataCy="register-institution-razao-social-input"
                dataTestId="institution-razao-social-input"
                label="Razão Social"
            />
            <Input
                {...register("institutionEmail")}
                type="text"
                errorMessage={errors.institutionEmail?.message}
                placeholder="nome@email.com"
                dataCy="register-institution-email-input"
                dataTestId="institution-email-input"
                label="E-mail"
            />
            <Input
                {...register("institutionPhone")}
                type="text"
                errorMessage={errors.institutionPhone?.message}
                placeholder="DD9XXXXXXXX"
                dataCy="register-institution-phone-input"
                dataTestId="institution-phone-input"
                label="Telefone"
            />
            {isEstadosSuccess && estados ? (
                <ComboBox
                    data={estados.map((estado) => ({
                        id: estado.id,
                        name: estado.nome,
                        sigla: estado.sigla,
                    }))}
                    errorMessage={errors.state ? "Estado da instituição é obrigatório." : ""}
                    placeholder="Digite o estado e selecione"
                    selectedValue={selectedEstado}
                    onChange={handleEstadoChange}
                    dataCy="register-institution-state"
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
                    errorMessage={errors.city ? "Cidade da instituição é obrigatório." : ""}
                    placeholder="Digite a cidade e selecione"
                    selectedValue={selectedMunicipio}
                    onChange={handleMunicipioChange}
                    dataCy="register-institution-city"
                    data-testid="institution-city-input"
                >
                    Cidade
                </ComboBox>
            ) : (
                <Input
                    disabled
                    errorMessage={errors.city ? "Cidade da instituição é obrigatório." : ""}
                    placeholder="Selecione um estado"
                    dataCy="register-institution-city-input"
                    dataTestId="institution-city-input"
                    label="Cidade"
                />
            )}
            <Input
                {...register("address")}
                type="text"
                errorMessage={errors.address?.message}
                placeholder="Rua, número, bairro"
                dataCy="register-institution-address-input"
                dataTestId="institution-address-input"
                label="Endereço"
            />

            <h3 className="text-center text-xl font-bold leading-9 tracking-tight text-gray-900">
                Dados de contato
            </h3>
            <Input
                {...register("contactName")}
                type="text"
                errorMessage={errors.contactName?.message}
                placeholder="Digite seu nome completo"
                dataCy="register-contact-name-input"
                dataTestId="name-input"
                label="Nome"
            />
            <Input
                {...register("contactEmail")}
                type="text"
                errorMessage={errors.contactEmail?.message}
                placeholder="nome@email.com"
                dataCy="register-contact-email-input"
                dataTestId="email-input"
                label="E-mail"
            />
            <Input
                {...register("contactPhone")}
                type="text"
                errorMessage={errors.contactPhone?.message}
                placeholder="DD9XXXXXXXX"
                dataCy="register-contact-phone-input"
                dataTestId="contact-phone-input"
                label="Celular"
            />
            <div className="flex gap-2 py-4">
                <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsModalOpen(false)}
                    variant="secondary"
                    dataCy="register-cancel-btn"
                    dataTestId="cancel-btn"
                    className="w-full"
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    dataCy="register-submit-btn"
                    dataTestId="submit-btn"
                    className="w-full"
                >
                    Cadastrar
                </Button>
            </div>
        </Form>
    );
};

export default RegisterForm;
