"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { UnitDTO, useDeleteUnitOperationMutation } from "@/redux/features/unitApiSlice";
import { apiSlice } from "@/redux/services/apiSlice";
import { getUnitOperation, isResponseError } from "@/redux/services/helpers";
import type { ClientOperationDTO } from "@/types/client";

import { OperationType } from "@/enums";
import { useSingleClientLoading } from "@/hooks";
import { closeModal, Modals, openModal } from "@/redux/features/modalSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

import { ArrowClockwiseIcon } from "@phosphor-icons/react";

import { ClientDetails, UnitList } from "@/components/client";
import { Button, Modal, Spinner } from "@/components/common";
import {
    AddUnitForm,
    EditClientForm,
    EditUnitForm,
    Input,
    ReviewDeleteUnitForm,
} from "@/components/forms";
import { Typography } from "@/components/foundation";
import { ModalDeleteUnit } from "@/components/modals";

function ClientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const dispatch = useAppDispatch();

    const cnpj = params.cnpj as string;

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

    const [deleteUnitOperation] = useDeleteUnitOperationMutation();

    const [selectedClientInOperation, setSelectedClientInOperation] =
        useState<ClientOperationDTO | null>(null);

    const { isModalOpen, currentModal, selectedUnit, selectedUnitOperation } = useAppSelector(
        (state) => state.modal,
    );

    const [searchTerm, setSearchTerm] = useState("");
    const [searchedUnits, setSearchedUnits] = useState<UnitDTO[]>([]);

    const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const handleModalAddUnit = () => {
        dispatch(openModal(Modals.ADD_UNIT));
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
                        },
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
            ]),
        );
    };

    // Filter units by search term
    useEffect(() => {
        if (filteredUnits.length > 0) {
            const addUnitsInOperation =
                unitsOperations?.filter(
                    (operation) => operation.operation_type === OperationType.ADD,
                ) ?? [];

            const selectedClientID = filteredUnits[0].client;
            const units = [
                ...filteredUnits,
                ...addUnitsInOperation.filter((operation) => operation.client === selectedClientID),
            ];

            if (searchTerm.length > 0) {
                const searchedUnits = units.filter((unit) =>
                    unit.name.toLowerCase().includes(searchTerm.toLowerCase()),
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
        if (isLoadingClientsOperations || !filteredClient) {
            return;
        }

        const operation = clientsOperations?.find(
            (operation) => operation.original_client === filteredClient?.id,
        );
        operation ? setSelectedClientInOperation(operation) : setSelectedClientInOperation(null);
    }, [isLoadingClientsOperations, clientsOperations, filteredClient]);

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
                <Button onClick={() => router.back()} data-testid="btn-back-to-search">
                    Voltar à busca
                </Button>
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
                <Button onClick={() => router.refresh()} data-testid="btn-refresh">
                    Tentar novamente
                </Button>
            </div>
        );
    }

    return (
        <main className="flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row gap-6">
                <Button
                    variant="secondary"
                    className="fixed bottom-4 right-4 z-10 shadow-lg px-4 py-2"
                    disabled={isLoadingClientData}
                    onClick={handleUpdateData}
                    dataTestId="update-data-btn"
                    data-cy="gp-update-data-btn"
                >
                    <div className="flex items-center gap-2">
                        <ArrowClockwiseIcon size="24" />
                        <span className="hidden md:inline">Atualizar</span>
                    </div>
                </Button>

                {filteredClient && clientsOperations && (
                    <ClientDetails
                        title="Informações do cliente"
                        isLoading={isLoadingClientData}
                        clientOptions={[]} // Empty array since we don't need client selector
                        selectedClient={{ id: filteredClient.id, value: filteredClient.name }}
                        setSelectedClient={() => {}} // No-op since client is fixed
                        filteredClient={filteredClient}
                        selectedClientInOperation={selectedClientInOperation}
                        hideClientSelector={true}
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

                    {filteredClient && (
                        <Button
                            onClick={handleModalAddUnit}
                            data-testid="btn-add-unit"
                            data-cy="gp-add-unit-btn"
                        >
                            Adicionar unidade
                        </Button>
                    )}
                </div>
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
                        description={`Por favor, edite os campos que deseja atualizar,
                            certificando-se de preencher as informações corretamente.`}
                        client={filteredClient}
                    />
                )}

                {currentModal === Modals.REVIEW_CLIENT &&
                    selectedClientInOperation &&
                    filteredClient && (
                        <div className="flex flex-row">
                            <EditClientForm
                                title="Alterações requisitadas"
                                reviewMode
                                client={selectedClientInOperation}
                            />

                            <EditClientForm
                                title="Informações atuais"
                                disabled
                                client={filteredClient}
                            />
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
                        description={`Por favor, edite os campos que deseja atualizar,
                        certificando-se de preencher as informações corretamente.`}
                        unit={selectedUnit}
                    />
                )}

                {currentModal === Modals.REVIEW_EDIT_UNIT && selectedUnit && filteredClient && (
                    <div className="flex flex-row">
                        <EditUnitForm
                            title="Alterações requisitadas"
                            reviewMode
                            unit={selectedUnitOperation as UnitDTO}
                        />

                        <EditUnitForm title="Informações atuais" disabled unit={selectedUnit} />
                    </div>
                )}

                {currentModal === Modals.DELETE_UNIT && <ModalDeleteUnit />}

                {currentModal === Modals.REVIEW_DELETE_UNIT && selectedUnitOperation && (
                    <ReviewDeleteUnitForm
                        title="O cliente deseja remover esta unidade. Você concorda?"
                        unitOperationID={selectedUnitOperation.id}
                    />
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

export default ClientDetailPage;
