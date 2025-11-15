"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { ContractType } from "@/enums";
import { useIBGELocalidades } from "@/hooks";
import { closeModal } from "@/redux/features/modalSlice";
import { useCreateProposalMutation } from "@/redux/features/proposalApiSlice";
import { useAppDispatch } from "@/redux/hooks";
import { handleApiError } from "@/redux/services/errorHandling";
import { proposalSchema } from "@/schemas";

import { Button, Spinner } from "@/components/common";
import { ComboBox, Form, Input, Select } from "@/components/forms";
import { Typography } from "@/components/foundation";

export type CreateProposalFields = z.infer<typeof proposalSchema>;

type CreateProposalFormProps = {
    title?: string;
    description?: string;
};

const CONTRACT_TYPE_OPTIONS = [
    { id: 1, value: "Anual" },
    { id: 2, value: "Mensal" },
    { id: 3, value: "Semanal" },
];

const CreateProposalForm = ({ title, description }: CreateProposalFormProps) => {
    const dispatch = useAppDispatch();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        watch,
    } = useForm<CreateProposalFields>({
        resolver: zodResolver(proposalSchema),
        defaultValues: {
            date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
            contract_type: ContractType.ANNUAL,
        },
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

    const [createProposal] = useCreateProposalMutation();

    const selectedContractType = watch("contract_type");

    const onSubmit: SubmitHandler<CreateProposalFields> = async (data) => {
        try {
            const response = await createProposal(data);

            if (response.error) {
                handleApiError(response.error, "Proposal creation error");
                return;
            }

            toast.success("Proposta criada com sucesso!");
            dispatch(closeModal());
        } catch (error) {
            handleApiError(error, "Unexpected error creating proposal");
        }
    };

    const getSelectedContractTypeData = () => {
        switch (selectedContractType) {
            case ContractType.ANNUAL:
                return CONTRACT_TYPE_OPTIONS[0];
            case ContractType.MONTHLY:
                return CONTRACT_TYPE_OPTIONS[1];
            case ContractType.WEEKLY:
                return CONTRACT_TYPE_OPTIONS[2];
            default:
                return CONTRACT_TYPE_OPTIONS[0];
        }
    };

    const handleContractTypeChange = (selected: { id: number; value: string }) => {
        switch (selected.id) {
            case 1:
                setValue("contract_type", ContractType.ANNUAL, { shouldValidate: true });
                break;
            case 2:
                setValue("contract_type", ContractType.MONTHLY, { shouldValidate: true });
                break;
            case 3:
                setValue("contract_type", ContractType.WEEKLY, { shouldValidate: true });
                break;
        }
    };

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Typography element="h3" size="title3" className="font-semibold">
                    {title || "Criar Proposta"}
                </Typography>

                {description && (
                    <Typography element="p" size="md" className="text-justify">
                        {description}
                    </Typography>
                )}

                <Input
                    {...register("cnpj")}
                    type="text"
                    errorMessage={errors.cnpj?.message}
                    placeholder="Digite o CNPJ"
                    label="CNPJ"
                    data-testid="proposal-cnpj-input"
                ></Input>

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
                        data-testid="proposal-state-input"
                    >
                        Estado
                    </ComboBox>
                ) : (
                    <div className="flex flex-col items-center">
                        <Spinner md />
                        <Typography element="p" size="md" className="text-center">
                            Carregando estados...
                        </Typography>
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
                        data-testid="proposal-city-input"
                    >
                        Cidade
                    </ComboBox>
                ) : (
                    <Input
                        disabled
                        errorMessage={errors.city ? "Cidade da instituição é obrigatório." : ""}
                        placeholder="Selecione um estado"
                        label="Cidade"
                        data-testid="proposal-city-input"
                    ></Input>
                )}

                <Input
                    {...register("contact_name")}
                    type="text"
                    errorMessage={errors.contact_name?.message}
                    placeholder="Digite o nome do contato"
                    label="Nome do Contato"
                    data-testid="proposal-contact-name-input"
                ></Input>

                <Input
                    {...register("contact_phone")}
                    type="text"
                    errorMessage={errors.contact_phone?.message}
                    placeholder="Digite o telefone do contato"
                    label="Telefone do Contato"
                    data-testid="proposal-contact-phone-input"
                ></Input>

                <Input
                    {...register("email")}
                    type="email"
                    errorMessage={errors.email?.message}
                    placeholder="Digite o e-mail do contato"
                    label="E-mail"
                    data-testid="proposal-email-input"
                ></Input>

                <Input
                    {...register("date")}
                    type="date"
                    errorMessage={errors.date?.message}
                    label="Data"
                    data-testid="proposal-date-input"
                ></Input>

                <Input
                    {...register("value")}
                    type="number"
                    step="0.01"
                    errorMessage={errors.value?.message}
                    placeholder="Digite o valor da proposta"
                    label="Valor"
                    data-testid="proposal-value-input"
                ></Input>

                <Select
                    options={CONTRACT_TYPE_OPTIONS}
                    selectedData={getSelectedContractTypeData()}
                    setSelect={handleContractTypeChange}
                    label="Tipo de Contrato"
                    dataTestId="proposal-contract-type-select"
                />

                <div className="flex gap-2 py-4">
                    <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => dispatch(closeModal())}
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
                        {isSubmitting ? "Criando..." : "Criar"}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default CreateProposalForm;
