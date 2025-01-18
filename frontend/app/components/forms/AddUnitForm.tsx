import { isErrorWithMessages } from "@/redux/services/helpers";
import { useCreateUnitMutation } from "@/redux/features/unitApiSlice";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { OperationType } from "@/enums";
import { unitSchema } from "@/schemas";
import { useIBGELocalidades } from "@/hooks";

import { Typography } from "@/components/foundation";
import { Spinner, Button } from "@/components/common";
import { Form, Input, ComboBox } from "@/components/forms";

export type AddUnitFields = z.infer<typeof unitSchema>;

type AddUnitFormProps = {
    clientId: number;
    setIsModalOpen: (value: boolean) => void;
};

const AddUnitForm = ({ clientId, setIsModalOpen }: AddUnitFormProps) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
    } = useForm<AddUnitFields>({
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

    const [requestAddUnit] = useCreateUnitMutation();

    const onSubmit: SubmitHandler<AddUnitFields> = async (data) => {
        try {
            const response = await requestAddUnit({
                ...data,
                client: clientId,
                operation_type: OperationType.ADD,
            });

            if (response.error) {
                if (isErrorWithMessages(response.error)) {
                    toast.error(response.error.data.messages[0]);
                    return;
                }
            }

            toast.success("Requisição enviada com sucesso!");
            setIsModalOpen(false);
        } catch (error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }
    };

    return (
        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Typography
                    element="h3"
                    size="title3"
                    className="font-semibold"
                >
                    Informe os dados da unidade
                </Typography>
                <Typography element="p" size="md" className="text-justify">
                    Por favor, preencha os campos abaixo com as informações da
                    unidade, certificando-se de preencher as informações
                    corretamente. Após a submissão, o formulário será enviado
                    para análise de um físico médico responsável, que fará a
                    revisão e validação das informações fornecidas.
                </Typography>
                <Input
                    {...register("name")}
                    type="text"
                    errorMessage={errors.name?.message}
                    placeholder="Digite o nome da unidade"
                    data-testid="unit-name-input"
                >
                    Nome
                </Input>
                <Input
                    {...register("cnpj")}
                    type="text"
                    errorMessage={errors.cnpj?.message}
                    placeholder="Digite o CNPJ da unidade"
                    data-testid="unit-cnpj-input"
                >
                    CNPJ
                </Input>
                <Input
                    {...register("email")}
                    type="text"
                    errorMessage={errors.email?.message}
                    placeholder="nome@email.com"
                    data-testid="unit-email-input"
                >
                    E-mail
                </Input>
                <Input
                    {...register("phone")}
                    type="text"
                    errorMessage={errors.phone?.message}
                    placeholder="DD9XXXXXXXX"
                    data-testid="unit-phone-input"
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
                        errorMessage={
                            errors.state
                                ? "Cidade da instituição é obrigatória."
                                : ""
                        }
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
                        errorMessage={
                            errors.state
                                ? "Cidade da instituição é obrigatória."
                                : ""
                        }
                        placeholder="Selecione um estado"
                        data-testid="unit-city-input"
                    >
                        Cidade
                    </Input>
                )}
                <Input
                    {...register("address")}
                    type="text"
                    errorMessage={errors.address?.message}
                    placeholder="Rua, número, bairro"
                    data-testid="unit-address-input"
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
                        Requisitar
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default AddUnitForm;
