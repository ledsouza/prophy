"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { unitSchema } from "@/schemas";

import { isErrorWithMessages } from "@/redux/services/helpers";
import { useCreateAddUnitOperationMutation } from "@/redux/features/unitApiSlice";

import { useIBGELocalidades, useNeedReview } from "@/hooks";

import { Typography } from "@/components/foundation";
import { Spinner, Button } from "@/components/common";
import { Form, Input, ComboBox } from "@/components/forms";
import { useAppDispatch } from "@/redux/hooks";
import { closeModal } from "@/redux/features/modalSlice";
import { OperationStatus } from "@/enums";

export type AddUnitFields = z.infer<typeof unitSchema>;

type AddUnitFormFields = z.input<typeof unitSchema>;

type AddUnitFormProps = {
    clientId: number;
};

const AddUnitForm = ({ clientId }: AddUnitFormProps) => {
    const dispatch = useAppDispatch();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
    } = useForm<AddUnitFormFields>({
        resolver: zodResolver(unitSchema),
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

    const { needReview } = useNeedReview();
    const [createAddUnitOperation] = useCreateAddUnitOperationMutation();

    const onSubmit: SubmitHandler<AddUnitFormFields> = async (data) => {
        try {
            const response = needReview
                ? await createAddUnitOperation({
                      ...data,
                      client: clientId,
                      operation_status: OperationStatus.REVIEW,
                  })
                : await createAddUnitOperation({
                      ...data,
                      client: clientId,
                      operation_status: OperationStatus.ACCEPTED,
                  });

            if (response.error) {
                if (isErrorWithMessages(response.error)) {
                    toast.error(response.error.data.messages[0]);
                    return;
                }
            }

            const successMessage = needReview
                ? "Requisição enviada com sucesso."
                : "Unidade adicionada com sucesso.";

            toast.success(successMessage);
            dispatch(closeModal());
        } catch (error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }
    };

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Typography element="h3" size="title3" className="font-semibold">
                    Informe os dados da unidade
                </Typography>
                <Typography element="p" size="md" className="text-justify">
                    Por favor, preencha os campos abaixo com as informações da unidade,
                    certificando-se de preencher as informações corretamente. Após a submissão, o
                    formulário será enviado para análise de um físico médico responsável, que fará a
                    revisão e validação das informações fornecidas.
                </Typography>
                <Input
                    {...register("name")}
                    type="text"
                    errorMessage={errors.name?.message}
                    placeholder="Digite o nome da unidade"
                    data-testid="unit-name-input"
                    label="Nome"
                />
                <Input
                    {...register("cnpj")}
                    type="text"
                    errorMessage={errors.cnpj?.message}
                    placeholder="Digite o CNPJ da unidade"
                    data-testid="unit-cnpj-input"
                    label="CNPJ"
                />
                <Input
                    {...register("email")}
                    type="text"
                    errorMessage={errors.email?.message}
                    placeholder="nome@email.com"
                    data-testid="unit-email-input"
                    label="E-mail"
                />
                <Input
                    {...register("phone")}
                    type="text"
                    errorMessage={errors.phone?.message}
                    placeholder="DD9XXXXXXXX"
                    data-testid="unit-phone-input"
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
                        data-testid="unit-state-input"
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
                        errorMessage={errors.state ? "Cidade da instituição é obrigatória." : ""}
                        placeholder="Digite a cidade e selecione"
                        selectedValue={selectedMunicipio}
                        onChange={handleMunicipioChange}
                        data-testid="unit-city-input"
                    >
                        Cidade
                    </ComboBox>
                ) : (
                    <Input
                        disabled
                        errorMessage={errors.state ? "Cidade da instituição é obrigatória." : ""}
                        placeholder="Selecione um estado"
                        data-testid="unit-city-input"
                        label="Cidade"
                    />
                )}
                <Input
                    {...register("address")}
                    type="text"
                    errorMessage={errors.address?.message}
                    placeholder="Rua, número, bairro"
                    data-testid="unit-address-input"
                    label="Endereço"
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
                        {needReview ? "Requisitar" : "Adicionar"}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default AddUnitForm;
