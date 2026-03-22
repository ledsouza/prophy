"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ArrowClockwiseIcon } from "@phosphor-icons/react";

import { OperationType } from "@/enums";
import Role from "@/enums/Role";
import { useSingleClientLoading } from "@/hooks";
import { apiSlice } from "@/redux/services/apiSlice";
import { getUnitOperation, isResponseError } from "@/redux/services/helpers";
import {
    UnitDTO,
    useCreateDeleteUnitOperationMutation,
    useDeleteUnitOperationMutation,
} from "@/redux/features/unitApiSlice";
import type { ClientOperationDTO } from "@/types/client";
import { closeModal, Modals, openModal } from "@/redux/features/modalSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

import { ClientDetails, UnitList } from "@/components/client";
import { Button, Modal, ResourcePanelShell, Spinner } from "@/components/common";
import {
    AddUnitForm,
    EditClientForm,
    EditUnitForm,
    Input,
    ReviewDeleteUnitForm,
} from "@/components/forms";
import { Typography } from "@/components/foundation";
import { ModalDeleteUnit } from "@/components/modals";

type MedicalPhysicistClientDetailPageProps = {
    cnpj: string;
    role: Role.FMI | Role.FME;
};

export default function MedicalPhysicistClientDetailPage({
    cnpj,
    role,
}: MedicalPhysicistClientDetailPageProps) {
    const dispatch = useAppDispatch();

    const {
        isLoading: isLoadingClientData,
        hasNoData,
        clientNotFound,
        filteredClient,
        filteredUnits,
        clientsOperations,
        unitsOperations,
        isLoadingClientsOperations,
        isLoadingUnitsOperations,
    } = useSingleClientLoading(cnpj);

    const [selectedClientInOperation, setSelectedClientInOperation] =
        useState<ClientOperationDTO | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchedUnits, setSearchedUnits] = useState<UnitDTO[]>([]);

    const isExternalMedicalPhysicist = role === Role.FME;

    const [createDeleteUnitOperation] = useCreateDeleteUnitOperationMutation();
    const [deleteUnitOperation] = useDeleteUnitOperationMutation();

    const { isModalOpen, currentModal, selectedUnit, selectedUnitOperation } = useAppSelector(
        (state) => state.modal,
    );

    const handleUpdateData = () => {
        dispatch(
            apiSlice.util.invalidateTags([
                { type: "Client", id: "LIST" },
                { type: "ClientOperation", id: "LIST" },
                { type: "Unit", id: "LIST" },
                { type: "UnitOperation", id: "LIST" },
                { type: "Equipment", id: "LIST" },
                { type: "EquipmentOperation", id: "LIST" },
            ]),
        );
    };

    const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const handleModalAddUnit = () => {
        dispatch(openModal(Modals.ADD_UNIT));
    };

    const handleConfirmRejectUnit = async (unit: UnitDTO) => {
        const unitOperation = getUnitOperation(unit, unitsOperations);

        if (!unitOperation) {
            toast.error("Requisição não encontrada. Atualize a página e tente novamente.");
            return;
        }

        try {
            const response = await deleteUnitOperation(unitOperation.id);
            if (isResponseError(response)) {
                if (response.error.status === 404) {
                    toast.error(
                        `A requisição não foi encontrada.
                        Por favor, recarregue a página para atualizar a lista de requisições.`,
                        {
                            autoClose: 5000,
                        },
                    );
                    return;
                }

                toast.error("Algo deu errado. Tente novamente mais tarde.");
                return;
            }
        } catch (_error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
            return;
        }

        dispatch(closeModal());
    };

    const handleCreateDeleteUnit = async (unit: UnitDTO) => {
        try {
            const response = await createDeleteUnitOperation(unit.id);
            if (isResponseError(response)) {
                toast.error(response.error.data.message);
                return;
            }

            toast.success("Requisição enviada com sucesso!");
            dispatch(closeModal());
        } catch (_error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }
    };

    useEffect(() => {
        if (filteredUnits.length > 0) {
            const addUnitsInOperation =
                unitsOperations?.filter(
                    (operation) => operation.operation_type === OperationType.ADD,
                ) ?? [];

            const selectedClientId = filteredUnits[0].client;
            const units = [
                ...filteredUnits,
                ...addUnitsInOperation.filter(
                    (operation) => operation.client === selectedClientId,
                ),
            ];

            if (searchTerm.length > 0) {
                setSearchedUnits(
                    units.filter((unit) =>
                        unit.name.toLowerCase().includes(searchTerm.toLowerCase()),
                    ),
                );
                return;
            }

            setSearchedUnits(units);
            return;
        }

        setSearchedUnits([]);
    }, [filteredUnits, searchTerm, unitsOperations]);

    useEffect(() => {
        if (isLoadingClientsOperations || !filteredClient) {
            return;
        }

        const operation = clientsOperations?.find(
            (clientOperation) => clientOperation.original_client === filteredClient.id,
        );

        setSelectedClientInOperation(operation ?? null);
    }, [clientsOperations, filteredClient, isLoadingClientsOperations]);

    if (isLoadingClientData || isLoadingUnitsOperations) {
        return <Spinner fullscreen />;
    }

    if (clientNotFound) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-8">
                <Typography
                    element="h2"
                    size="title2"
                    className="font-bold"
                    dataTestId="client-not-found"
                >
                    Cliente não encontrado
                </Typography>
                <Typography element="p" size="lg">
                    Não foi possível encontrar um cliente com o CNPJ informado.
                </Typography>
            </div>
        );
    }

    if (hasNoData) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-8">
                <Typography
                    element="h2"
                    size="title2"
                    className="font-bold"
                    dataTestId="data-not-found"
                >
                    Nenhum dado encontrado
                </Typography>
                <Typography element="p" size="lg">
                    Não encontramos nenhum dado associado a essa conta! Por favor, entre em contato
                    conosco.
                </Typography>
                <Button onClick={handleUpdateData} data-testid="btn-refresh">
                    Tentar novamente
                </Button>
            </div>
        );
    }

    return (
        <main className="flex flex-col gap-6 px-4 py-4 md:px-6 lg:px-8">
            <div className="flex flex-col gap-6 md:flex-row">
                <Button
                    variant="secondary"
                    className="fixed bottom-4 right-4 z-10 px-4 py-2 shadow-lg"
                    disabled={isLoadingClientData}
                    onClick={handleUpdateData}
                    dataTestId="update-data-btn"
                >
                    <div className="flex items-center gap-2">
                        <ArrowClockwiseIcon size="24" />
                        <span className="hidden md:inline">Atualizar</span>
                    </div>
                </Button>

                {filteredClient && (
                    <ClientDetails
                        title={
                            isExternalMedicalPhysicist
                                ? "Informações da instituição"
                                : "Informações do cliente"
                        }
                        isLoading={isLoadingClientData}
                        clientOptions={[]}
                        selectedClient={{ id: filteredClient.id, value: filteredClient.name }}
                        setSelectedClient={() => {}}
                        filteredClient={filteredClient}
                        selectedClientInOperation={selectedClientInOperation}
                        hideClientSelector
                    />
                )}

                <ResourcePanelShell className="h-[60vh] w-full md:h-[80vh] md:w-2/3">
                    <Typography element="h2" size="title2" className="font-bold">
                        Unidades
                    </Typography>

                    {filteredUnits.length !== 0 && (
                        <Input
                            placeholder="Buscar unidades por nome"
                            value={searchTerm}
                            onChange={handleSearchInputChange}
                            dataTestId="input-search-unit"
                        />
                    )}

                    <div className="flex-1 overflow-y-auto px-3 py-3 [scrollbar-gutter:stable]">
                        <UnitList searchedUnits={searchedUnits} filteredUnits={filteredUnits} />
                    </div>

                    {filteredClient && (
                        <Button onClick={handleModalAddUnit} data-testid="btn-add-unit">
                            Adicionar unidade
                        </Button>
                    )}
                </ResourcePanelShell>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => dispatch(closeModal())}
                className={
                    currentModal === Modals.REVIEW_CLIENT ||
                    currentModal === Modals.REVIEW_EDIT_UNIT
                        ? "max-w-6xl mx-6"
                        : "max-w-lg"
                }
            >
                {currentModal === Modals.EDIT_CLIENT && filteredClient && (
                    <EditClientForm
                        title="Atualização de dados"
                        description={
                            isExternalMedicalPhysicist
                                ? `Por favor, edite os campos que deseja atualizar,
                        certificando-se de preencher as informações corretamente.
                        Após a submissão, o formulário será enviado para análise de
                        um físico médico responsável, que fará a revisão e validação
                        das informações fornecidas.`
                                : `Por favor, edite os campos que deseja atualizar,
                            certificando-se de preencher as informações corretamente.`
                        }
                        client={filteredClient}
                    />
                )}

                {currentModal === Modals.REVIEW_CLIENT &&
                    selectedClientInOperation &&
                    filteredClient && (
                        <EditClientForm
                            title="Revisão de atualização de dados"
                            description={'Uma alteração foi detectada em "Informações de Contato"'}
                            reviewMode
                            client={selectedClientInOperation}
                            originalClient={filteredClient}
                        />
                    )}

                {currentModal === Modals.REJECT_CLIENT && isExternalMedicalPhysicist && (
                    <div className="m-6 max-w-md sm:mx-auto sm:w-full sm:max-w-md">
                        <Typography element="h2" size="title2" className="mb-6">
                            Notas do Físico Médico Responsável
                        </Typography>

                        <Typography element="p" size="lg" className="wrap-break-word">
                            {(selectedClientInOperation?.note ?? "")
                                .split("\n")
                                .map((line: string, index: number) => (
                                    <span key={index}>
                                        {line}
                                        <br />
                                    </span>
                                ))}
                        </Typography>

                        <Button
                            onClick={() => dispatch(closeModal())}
                            className="w-full mt-6"
                            data-testid="btn-confirm-reject-client"
                        >
                            Confirmar
                        </Button>
                    </div>
                )}

                {currentModal === Modals.ADD_UNIT && filteredClient?.id && (
                    <AddUnitForm clientId={filteredClient.id} />
                )}

                {currentModal === Modals.REVIEW_ADD_UNIT && selectedUnitOperation && (
                    <EditUnitForm
                        title="Unidade requisitada"
                        description={`Verifique as informações. Se identificar algum erro,
                            você pode editá-las ou rejeitá-las completamente.`}
                        reviewMode
                        unit={selectedUnitOperation as UnitDTO}
                    />
                )}

                {currentModal === Modals.EDIT_UNIT && selectedUnit && (
                    <EditUnitForm
                        title="Atualização de dados"
                        description={
                            isExternalMedicalPhysicist
                                ? `Por favor, edite os campos que deseja atualizar,
                        certificando-se de preencher as informações corretamente.
                        Após a submissão, o formulário será enviado para análise de
                        um físico médico responsável, que fará a revisão e validação
                        das informações fornecidas.`
                                : `Por favor, edite os campos que deseja atualizar,
                        certificando-se de preencher as informações corretamente.`
                        }
                        unit={selectedUnit}
                    />
                )}

                {currentModal === Modals.REVIEW_EDIT_UNIT && selectedUnit && filteredClient && (
                    <EditUnitForm
                        title="Revisão de atualização de dados"
                        description={'Uma alteração foi detectada em "Informações da Unidade"'}
                        reviewMode
                        unit={selectedUnitOperation as UnitDTO}
                        originalUnit={selectedUnit}
                    />
                )}

                {currentModal === Modals.DELETE_UNIT &&
                    (isExternalMedicalPhysicist && selectedUnit ? (
                        <div className="m-6 max-w-md sm:mx-auto sm:w-full sm:max-w-md">
                            <Typography element="h2" size="title2" className="mb-6">
                                Tem certeza que deseja excluir esta unidade?
                            </Typography>

                            <div className="flex flex-row gap-2">
                                <Button
                                    onClick={() => dispatch(closeModal())}
                                    className="w-full mt-6"
                                    data-testid="btn-cancel-delete-unit"
                                >
                                    Cancelar
                                </Button>

                                <Button
                                    variant="danger"
                                    onClick={() => handleCreateDeleteUnit(selectedUnit)}
                                    className="w-full mt-6"
                                    data-testid="btn-confirm-delete-unit"
                                >
                                    Confirmar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <ModalDeleteUnit />
                    ))}

                {currentModal === Modals.REVIEW_DELETE_UNIT && selectedUnitOperation && (
                    <ReviewDeleteUnitForm
                        title="O cliente deseja remover esta unidade. Você concorda?"
                        unitOperationID={selectedUnitOperation.id}
                    />
                )}

                {currentModal === Modals.REJECT_UNIT && selectedUnit && unitsOperations && (
                    <div className="m-6 max-w-md sm:mx-auto sm:w-full sm:max-w-md">
                        <Typography element="h2" size="title2" className="mb-6">
                            Notas do Físico Médico Responsável
                        </Typography>

                        <Typography element="p" size="lg">
                            {getUnitOperation(selectedUnit, unitsOperations)?.note}
                        </Typography>

                        <Button
                            onClick={() => handleConfirmRejectUnit(selectedUnit)}
                            className="w-full mt-6"
                            data-testid="btn-confirm-reject-unit"
                        >
                            Confirmar
                        </Button>
                    </div>
                )}
            </Modal>
        </main>
    );
}