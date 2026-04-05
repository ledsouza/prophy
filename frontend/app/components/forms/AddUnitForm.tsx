"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { unitSchema } from "@/schemas";

import { isErrorWithMessages } from "@/redux/services/helpers";
import { useCreateAddUnitOperationMutation } from "@/redux/features/unitApiSlice";

import { useIBGELocalidades, useNeedReview } from "@/hooks";

import { Button } from "@/components/common";
import { Typography } from "@/components/foundation";
import { Form } from "@/components/forms";
import { useAppDispatch } from "@/redux/hooks";
import { closeModal } from "@/redux/features/modalSlice";
import { OperationStatus } from "@/enums";
import UnitFields from "./UnitFields";

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
        <div className="w-full max-w-md sm:mx-auto sm:w-full">
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
                <UnitFields
                    register={register}
                    errors={errors}
                    estados={estados}
                    isEstadosSuccess={isEstadosSuccess}
                    selectedEstado={selectedEstado}
                    handleEstadoChange={handleEstadoChange}
                    municipios={municipios}
                    isMunicipiosSuccess={isMunicipiosSuccess}
                    selectedMunicipio={selectedMunicipio}
                    handleMunicipioChange={handleMunicipioChange}
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
