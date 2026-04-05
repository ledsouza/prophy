"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { useIBGELocalidades } from "@/hooks";
import { OperationStatus } from "@/enums";
import { unitSchema } from "@/schemas";
import { closeModal } from "@/redux/features/modalSlice";
import {
    UnitOperationDTO,
    useUpdateUnitMutation,
} from "@/redux/features/unitApiSlice";
import { useAppDispatch } from "@/redux/hooks";
import { isErrorWithMessages } from "@/redux/services/helpers";

import { Form, FormButtons, Textarea } from "@/components/forms";
import { Typography } from "@/components/foundation";

import UnitFields from "./UnitFields";

type ReviewAddUnitFields = z.input<typeof unitSchema>;
type ReviewAddUnitSubmitFields = ReviewAddUnitFields & { note?: string };

type ReviewAddUnitFormProps = {
    title?: string;
    description?: string;
    unitOperation: UnitOperationDTO;
};

const ReviewAddUnitForm = ({
    title = "Unidade requisitada",
    description = "Verifique as informações. Se identificar algum erro, você pode editá-las ou rejeitá-las completamente.",
    unitOperation,
}: ReviewAddUnitFormProps) => {
    const dispatch = useAppDispatch();
    const [isRejected, setIsRejected] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
    } = useForm<ReviewAddUnitFields>({
        resolver: zodResolver(unitSchema),
        defaultValues: {
            name: unitOperation.name,
            cnpj: unitOperation.cnpj,
            email: unitOperation.email,
            phone: unitOperation.phone,
            address: unitOperation.address,
            state: unitOperation.state,
            city: unitOperation.city,
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

    const [isLoadingIBGE, setIsLoadingIBGE] = useState(true);
    const [updateUnit] = useUpdateUnitMutation();

    const onSubmit: SubmitHandler<ReviewAddUnitFields> = async (data) => {
        try {
            const response = await updateUnit({
                unitID: unitOperation.id,
                unitData: {
                    ...data,
                    operation_status: OperationStatus.ACCEPTED,
                },
            });

            if (response.error) {
                if (isErrorWithMessages(response.error)) {
                    throw new Error(response.error.data.messages[0]);
                }

                throw new Error("Um erro inesperado ocorreu.");
            }

            toast.success("Dados atualizados com sucesso!");
            dispatch(closeModal());
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Algo deu errado. Tente novamente mais tarde.",
            );
        }
    };

    const onSubmitRejection = async (data: ReviewAddUnitSubmitFields) => {
        try {
            const response = await updateUnit({
                unitID: unitOperation.id,
                unitData: {
                    ...data,
                    operation_status: OperationStatus.REJECTED,
                    note: data.note,
                },
            });

            if (response.error) {
                if (isErrorWithMessages(response.error)) {
                    throw new Error(response.error.data.messages[0]);
                }

                throw new Error("Um erro inesperado ocorreu.");
            }

            toast.success("Revisão concluída! O cliente será notificado da rejeição.");
            dispatch(closeModal());
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Algo deu errado. Tente novamente mais tarde.",
            );
        }
    };

    useEffect(() => {
        if (!isLoadingIBGE) {
            return;
        }

        const estado = estados?.find(
            (item) => item.sigla?.toLowerCase() === unitOperation.state.toLowerCase(),
        );
        const municipio = municipios?.find(
            (item) => item.nome.toLowerCase() === unitOperation.city.toLowerCase(),
        );

        if (estado && selectedEstado?.id !== estado.id) {
            handleEstadoChange({
                id: estado.id,
                name: estado.nome,
                sigla: estado.sigla,
            });
        }

        if (municipio && selectedMunicipio?.id !== municipio.id) {
            handleMunicipioChange({
                id: municipio.id,
                name: municipio.nome,
            });
        }

        if (estados && municipios) {
            setIsLoadingIBGE(false);
        }
    }, [
        estados,
        municipios,
        unitOperation.state,
        unitOperation.city,
        handleEstadoChange,
        handleMunicipioChange,
        isLoadingIBGE,
        selectedEstado?.id,
        selectedMunicipio?.id,
    ]);

    return (
        <div className="w-full max-w-md sm:mx-auto sm:w-full" data-cy="review-add-unit-form">
            <Form
                onSubmit={handleSubmit((data) => {
                    if (isRejected) {
                        void onSubmitRejection(data);
                        return;
                    }

                    void onSubmit(data);
                })}
            >
                {!isRejected ? (
                    <>
                        <Typography element="h3" size="title3" className="font-semibold">
                            {title}
                        </Typography>
                        <Typography element="p" size="md" className="text-justify">
                            {description}
                        </Typography>
                    </>
                ) : (
                    <Typography element="h3" size="title3" className="font-semibold">
                        Por favor, justifique o motivo da rejeição
                    </Typography>
                )}

                {isRejected ? (
                    <Textarea
                        {...register("note" as never)}
                        rows={18}
                        errorMessage={errors.note?.message?.toString()}
                        placeholder="Justifique o motivo da rejeição"
                        data-testid="rejection-note-input"
                        dataCy="review-add-rejection-note-input"
                    />
                ) : (
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
                )}

                <FormButtons
                    isRejected={isRejected}
                    setIsRejected={setIsRejected}
                    reviewMode
                    isSubmitting={isSubmitting}
                    submitDataCy="review-add-accept-btn"
                />
            </Form>
        </div>
    );
};

export default ReviewAddUnitForm;