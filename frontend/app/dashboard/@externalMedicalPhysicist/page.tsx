"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { apiSlice } from "@/redux/services/apiSlice";
import { getUnitOperation, isResponseError } from "@/redux/services/helpers";
import {
    useDeleteClientOperationMutation,
    useListAllClientsOperationsQuery,
} from "@/redux/features/clientApiSlice";
import type { ClientOperationDTO } from "@/types/client";
import {
    UnitDTO,
    useCreateDeleteUnitOperationMutation,
    useDeleteUnitOperationMutation,
    useListAllUnitsOperationsQuery,
} from "@/redux/features/unitApiSlice";

import { useClientDataLoading } from "@/hooks/use-client-data-loading";
import { OperationType } from "@/enums";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

import { ArrowClockwise } from "@phosphor-icons/react";

import { Typography } from "@/components/foundation";
import { AddUnitForm, EditClientForm, EditUnitForm, Input } from "@/components/forms";
import { Button, Modal, Spinner } from "@/components/common";
import { ClientDetails, UnitList } from "@/components/client";
import { closeModal, Modals, openModal } from "@/redux/features/modalSlice";

function ClientPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const {
        isLoading: isLoadingClientData,
        hasNoData,
        clientOptions,
        selectedClient,
        filteredClient,
        filteredUnits,
        setSelectedClient,
    } = useClientDataLoading();

    const { data: clientsOperations, isLoading: isLoadingClientsOperations } =
        useListAllClientsOperationsQuery();
    const { data: unitsOperations, isLoading: isLoadingUnitsOperations } =
        useListAllUnitsOperationsQuery();

    const [deleteClientOperation] = useDeleteClientOperationMutation();
    const [createDeleteUnitOperation] = useCreateDeleteUnitOperationMutation();
    const [deleteUnitOperation] = useDeleteUnitOperationMutation();

    const [selectedClientInOperation, setSelectedClientInOperation] =
        useState<ClientOperationDTO | null>(null);

    const { currentModal, isModalOpen, selectedUnit } = useAppSelector((state) => state.modal);

    const [searchTerm, setSearchTerm] = useState("");
    const [searchedUnits, setSearchedUnits] = useState<UnitDTO[]>([]);

    const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const handleConfirmRejectClient = async () => {
        if (!selectedClientInOperation) {
            return;
        }

        try {
            const response = await deleteClientOperation(selectedClientInOperation?.id);
            if (isResponseError(response)) {
                if (response.error.status === 404) {
                    return toast.error(
                        `A requisição não foi encontrada.
                        Por favor, recarregue a página para atualizar a lista de requisições.`,
                        {
                            autoClose: 5000,
                        }
                    );
                }
                return toast.error("Algo deu errado. Tente novamente mais tarde.");
            }

            dispatch(closeModal());
        } catch (error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }
    };

    const handleModalAddUnit = () => {
        dispatch(openModal(Modals.ADD_UNIT));
    };

    const handleCreateDeleteUnitOperation = async (selectedUnit: UnitDTO) => {
        try {
            const response = await createDeleteUnitOperation(selectedUnit.id);
            if (isResponseError(response)) {
                return toast.error(response.error.data.message);
            }

            toast.success("Requisição enviada com sucesso!");
            dispatch(closeModal());
        } catch (error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }
    };

    const handleConfirmRejectUnit = async (selectedUnit: UnitDTO) => {
        const unitOperation = getUnitOperation(selectedUnit, unitsOperations);

        if (!unitOperation) {
            return toast.error("Requisição não encontrada. Atualize a página e tente novamente.");
        }

        try {
            const response = await deleteUnitOperation(unitOperation.id);
            if (isResponseError(response)) {
                if (response.error.status === 404) {
                    return toast.error(
                        `A requisição não foi encontrada.
                        Por favor, recarregue a página para atualizar a lista de requisições.`,
                        {
                            autoClose: 5000,
                        }
                    );
                }
                return toast.error("Algo deu errado. Tente novamente mais tarde.");
            }
        } catch (error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }

        dispatch(closeModal());
    };

    const handleUpdateData = () => {
        dispatch(
            apiSlice.util.invalidateTags([
                { type: "Client", id: "LIST" },
                { type: "ClientOperation", id: "LIST" },
                { type: "Unit", id: "LIST" },
                { type: "UnitOperation", id: "LIST" },
                { type: "Equipment", id: "LIST" },
                { type: "EquipmentOperation", id: "LIST" },
            ])
        );
    };

    // Filter units by search term
    useEffect(() => {
        if (filteredUnits.length > 0) {
            const addUnitsInOperation =
                unitsOperations?.filter(
                    (operation) => operation.operation_type === OperationType.ADD
                ) ?? [];

            const selectedClientID = filteredUnits[0].client;
            const units = [
                ...filteredUnits,
                ...addUnitsInOperation.filter((operation) => operation.client === selectedClientID),
            ];

            if (searchTerm.length > 0) {
                const searchedUnits = units.filter((unit) =>
                    unit.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
                setSearchedUnits(searchedUnits);
            } else {
                setSearchedUnits(units);
            }
        } else {
            setSearchedUnits([]);
        }
    }, [filteredUnits, searchTerm, unitsOperations]);

    // Check if the selected client has an operation in progress
    useEffect(() => {
        if (isLoadingClientsOperations) {
            return;
        }

        const operation = clientsOperations?.find(
            (operation) => operation.original_client === selectedClient?.id
        );
        operation ? setSelectedClientInOperation(operation) : setSelectedClientInOperation(null);
    }, [isLoadingClientsOperations, clientsOperations, selectedClient]);

    if (isLoadingClientData || isLoadingUnitsOperations) {
        return <Spinner fullscreen />;
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
                <Button onClick={() => router.refresh()} data-testid="btn-refresh">
                    Tentar novamente
                </Button>
            </div>
        );
    }

    return (
        <main className="flex flex-col md:flex-row gap-6 px-4 md:px-6 lg:px-8 py-4">
            <Button
                variant="secondary"
                className="fixed bottom-4 right-4 z-10 shadow-lg px-4 py-2"
                disabled={isLoadingClientData}
                onClick={handleUpdateData}
                dataTestId="update-data-btn"
            >
                <div className="flex items-center gap-2">
                    <ArrowClockwise size="24" /> Atualizar
                </div>
            </Button>

            {clientOptions && selectedClient && filteredClient && clientsOperations && (
                <ClientDetails
                    title="Informações da instituição"
                    isLoading={isLoadingClientData}
                    clientOptions={clientOptions}
                    selectedClient={selectedClient}
                    setSelectedClient={setSelectedClient}
                    filteredClient={filteredClient}
                    selectedClientInOperation={selectedClientInOperation}
                />
            )}

            <div className="w-full md:w-2/3 h-[60vh] md:h-[80vh] flex flex-col min-h-0 gap-6 bg-white rounded-xl shadow-lg p-6 md:p-8">
                <Typography element="h2" size="title2" className="font-bold">
                    Unidades
                </Typography>

                {filteredUnits?.length !== 0 && (
                    <Input
                        placeholder="Buscar unidades por nome"
                        value={searchTerm}
                        onChange={handleSearchInputChange}
                        dataTestId="input-search-unit"
                    />
                )}

                <div className="flex-1 overflow-y-auto [scrollbar-gutter:stable] px-3 py-3">
                    <UnitList searchedUnits={searchedUnits} filteredUnits={filteredUnits} />
                </div>

                <Button onClick={handleModalAddUnit} data-testid="btn-add-unit">
                    Adicionar unidade
                </Button>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => dispatch(closeModal())} className="max-w-lg">
                {currentModal === Modals.EDIT_CLIENT && filteredClient && (
                    <EditClientForm
                        title="Atualização de dados"
                        description={`Por favor, edite os campos que deseja atualizar,
                        certificando-se de preencher as informações corretamente.
                        Após a submissão, o formulário será enviado para análise de
                        um físico médico responsável, que fará a revisão e validação
                        das informações fornecidas.`}
                        client={filteredClient}
                    />
                )}

                {currentModal === Modals.REJECT_CLIENT && (
                    <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
                        <Typography element="h2" size="title2" className="mb-6">
                            Notas do Físico Médico Responsável
                        </Typography>

                        <Typography element="p" size="lg" className="break-words">
                            {selectedClientInOperation?.note?.split("\n").map((line, index) => (
                                <span key={index}>
                                    {line}
                                    <br />
                                </span>
                            ))}
                        </Typography>

                        <Button
                            onClick={handleConfirmRejectClient}
                            className="w-full mt-6"
                            data-testid="btn-confirm-reject-client"
                        >
                            Confirmar
                        </Button>
                    </div>
                )}

                {currentModal === Modals.ADD_UNIT && selectedClient?.id && (
                    <AddUnitForm clientId={selectedClient.id} />
                )}

                {currentModal === Modals.EDIT_UNIT && selectedUnit && (
                    <EditUnitForm
                        title="Atualização de dados"
                        description={`Por favor, edite os campos que deseja atualizar,
                        certificando-se de preencher as informações corretamente.
                        Após a submissão, o formulário será enviado para análise de
                        um físico médico responsável, que fará a revisão e validação
                        das informações fornecidas.`}
                        unit={selectedUnit}
                    />
                )}

                {currentModal === Modals.DELETE_UNIT && selectedUnit && (
                    <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
                        <Typography element="h2" size="title2" className="mb-6">
                            Tem certeza que deseja excluir esta unidade?
                        </Typography>

                        <div className="flex flex-row gap-2">
                            <Button
                                onClick={() => {
                                    dispatch(closeModal());
                                }}
                                className="w-full mt-6"
                                data-testid="btn-cancel-delete-unit"
                            >
                                Cancelar
                            </Button>

                            <Button
                                variant="danger"
                                onClick={() => handleCreateDeleteUnitOperation(selectedUnit)}
                                className="w-full mt-6"
                                data-testid="btn-confirm-delete-unit"
                            >
                                Confirmar
                            </Button>
                        </div>
                    </div>
                )}

                {currentModal === Modals.REJECT_UNIT && selectedUnit && unitsOperations && (
                    <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
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

export default ClientPage;
