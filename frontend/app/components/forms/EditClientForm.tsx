"use client";

import { SubmitHandler, useForm } from "react-hook-form";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useIBGELocalidades } from "@/hooks";

import { ComboBox, Form, Input } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { Button, Spinner } from "@/components/common";
import { ClientDTO } from "@/redux/features/clientApiSlice";

const editClientSchema = z.object({
    name: z
        .string()
        .min(1, { message: "Nome da instituição é obrigatório." })
        .max(50, {
            message: "Nome da instituição não pode exceder 50 caracteres.",
        }),
    email: z.string().email({ message: "E-mail da instituição inválido." }),
    phone: z
        .string()
        .min(10, { message: "Telefone deve conter no mínimo 10 dígitos." })
        .max(11, { message: "Telefone deve conter no máximo 11 dígitos." })
        .regex(/^\d+$/, {
            message:
                "Telefone deve conter apenas números com padrão nacional (DDXXXXXXXX).",
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
});

export type EditClientFields = z.infer<typeof editClientSchema>;

type EditClientProps = {
    originalClient: ClientDTO;
    setIsModalOpen: (value: boolean) => void;
};

const EditClientForm = ({
    originalClient,
    setIsModalOpen,
}: EditClientProps) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
    } = useForm<EditClientFields>({
        resolver: zodResolver(editClientSchema),
    });

    const {
        estados,
        isEstadosSuccess,
        selectedEstado,
        setSelectedEstado,
        handleEstadoChange,
        municipios,
        isMunicipiosSuccess,
        selectedMunicipio,
        handleMunicipioChange,
    } = useIBGELocalidades(setValue);

    function onSubmit() {}

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <Typography element="h3" size="title3">
                Edite os dados de interesse
            </Typography>
            <Input
                {...register("name")}
                type="text"
                errorMessage={errors.name?.message}
                placeholder="Digite o nome completo da instituição"
                data-testid="institution-name-input"
            >
                Nome
            </Input>
            <Input
                {...register("email")}
                type="text"
                errorMessage={errors.email?.message}
                placeholder="nome@email.com"
                data-testid="institution-email-input"
            >
                E-mail
            </Input>
            <Input
                {...register("phone")}
                type="text"
                errorMessage={errors.phone?.message}
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
                    Requisitar alteração
                </Button>
            </div>
        </Form>
    );
};

export default EditClientForm;