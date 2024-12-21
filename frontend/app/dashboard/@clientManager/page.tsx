"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import {
    ClientOperationDTO,
    useDeleteClientOperationMutation,
    useListAllClientsOperationsQuery,
} from "@/redux/features/clientApiSlice";
import {
    UnitDTO,
    useCreateUnitMutation,
    useDeleteUnitOperationMutation,
    useListAllUnitsOperationsQuery,
} from "@/redux/features/unitApiSlice";
import {
    getEquipmentsCount,
    getUnitOperation,
    isResponseError,
} from "@/redux/services/helpers";

import { useClientDataLoading } from "@/hooks/use-client-data-loading";
import { OperationStatus, OperationType } from "@/enums";
import { handleCloseModal, Modals } from "@/utils/modal";

import { Typography } from "@/components/foundation";
import {
    AddUnitForm,
    EditClientForm,
    EditUnitForm,
    Input,
} from "@/components/forms";
import { Button, Modal, Spinner } from "@/components/common";
import { ClientDetails, UnitCard } from "@/components/client";

function ClientPage() {
    const router = useRouter();

    const {
        isLoading: isLoadingClientData,
        hasNoData,
        clientOptions,
        selectedClient,
        filteredClient,
        filteredUnits,
        equipments,
        setSelectedClient,
    } = useClientDataLoading();

    const { data: clientsOperations, isLoading: isLoadingClientsOperations } =
        useListAllClientsOperationsQuery();
    const { data: unitsOperations, isLoading: isLoadingUnitsOperations } =
        useListAllUnitsOperationsQuery();

    const [deleteClientOperation] = useDeleteClientOperationMutation();
    const [createUnitOperation] = useCreateUnitMutation();
    const [deleteUnitOperation] = useDeleteUnitOperationMutation();

    const [selectedClientInOperation, setSelectedClientInOperation] =
        useState<ClientOperationDTO | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentModal, setCurrentModal] = useState<Modals | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [searchedUnits, setSearchedUnits] = useState<UnitDTO[]>([]);
    const [selectedUnit, setSelectedUnit] = useState<UnitDTO | null>(null);

    const handleSearchInputChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setSearchTerm(event.target.value);
    };

    const handleEditClient = () => {
        setCurrentModal(Modals.EDIT_CLIENT);
        setIsModalOpen(true);
    };

    const handleRejectClient = () => {
        setCurrentModal(Modals.REJECT_CLIENT);
        setIsModalOpen(true);
    };

    const handleConfirmRejectClient = async () => {
        if (!selectedClientInOperation) {
            return;
        }

        try {
            const response = await deleteClientOperation(
                selectedClientInOperation?.id
            );
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
            }

            setIsModalOpen(false);
            setCurrentModal(null);
        } catch (error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }
    };

    const handleAddUnit = () => {
        setCurrentModal(Modals.ADD_UNIT);
        setIsModalOpen(true);
    };

    const handleEditUnit = (selectedUnit: UnitDTO) => {
        setSelectedUnit(selectedUnit);
        setCurrentModal(Modals.EDIT_UNIT);
        setIsModalOpen(true);
    };

    const handleCancelEditUnit = async (selectedUnit: UnitDTO) => {
        const unitOperation = getUnitOperation(selectedUnit, unitsOperations);
        if (!unitOperation) {
            return toast.error(
                "Requisição não encontrada. Atualize a página e tente novamente."
            );
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
            }

            toast.success("Requisição cancelada com sucesso.");
        } catch (error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }
    };

    const handleModalDeleteUnit = (selectedUnit: UnitDTO) => {
        setSelectedUnit(selectedUnit);
        setCurrentModal(Modals.DELETE_UNIT);
        setIsModalOpen(true);
    };

    const handleDeleteUnit = async (selectedUnit: UnitDTO) => {
        try {
            const response = await createUnitOperation({
                name: selectedUnit.name,
                address: selectedUnit.address,
                cnpj: selectedUnit.cnpj,
                phone: selectedUnit.phone,
                email: selectedUnit.email,
                state: selectedUnit.state,
                city: selectedUnit.city,
                client: selectedUnit.client,
                original_unit: selectedUnit.id,
                operation_type: OperationType.DELETE,
            });
            if (isResponseError(response)) {
                return toast.error(response.error.data.message);
            }

            toast.success(
                "Requisição para deletar unidade enviada com sucesso."
            );
            setIsModalOpen(false);
            setCurrentModal(null);
        } catch (error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }
    };

    const handleRejectUnit = (selectedUnit: UnitDTO) => {
        setSelectedUnit(selectedUnit);
        setCurrentModal(Modals.REJECT_UNIT);
        setIsModalOpen(true);
    };

    const handleConfirmRejectUnit = async (selectedUnit: UnitDTO) => {
        const unitOperation = getUnitOperation(selectedUnit, unitsOperations);

        if (!unitOperation) {
            return toast.error(
                "Requisição não encontrada. Atualize a página e tente novamente."
            );
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
            }
        } catch (error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }

        setIsModalOpen(false);
        setCurrentModal(null);
    };

    const handleUnitStatus = (unit: UnitDTO): OperationStatus => {
        const unitOperation = getUnitOperation(unit, unitsOperations);

        if (unitOperation) {
            return unitOperation.operation_status as OperationStatus;
        } else {
            return OperationStatus.ACCEPTED;
        }
    };

    // Filter units by search term
    useEffect(() => {
        if (filteredUnits.length > 0) {
            const addUnitsInOperation =
                unitsOperations?.filter(
                    (operation) =>
                        operation.operation_type === OperationType.ADD
                ) ?? [];

            const units = [...filteredUnits, ...addUnitsInOperation];

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
        operation
            ? setSelectedClientInOperation(operation)
            : setSelectedClientInOperation(null);
    }, [isLoadingClientsOperations, clientsOperations, selectedClient]);

    if (isLoadingClientData) {
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
                    Não encontramos nenhum dado associado a essa conta! Por
                    favor, entre em contato conosco.
                </Typography>
                <Button
                    onClick={() => router.refresh()}
                    data-testid="btn-refresh"
                >
                    Tentar novamente
                </Button>
            </div>
        );
    }

    return (
        <main className="flex flex-col md:flex-row gap-6 px-4 md:px-6 lg:px-8 py-4">
            {clientOptions &&
                selectedClient &&
                filteredClient &&
                clientsOperations && (
                    <ClientDetails
                        isLoading={isLoadingClientData}
                        clientOptions={clientOptions}
                        selectedClient={selectedClient}
                        setSelectedClient={setSelectedClient}
                        filteredClient={filteredClient}
                        selectedClientInOperation={selectedClientInOperation}
                        handleEdit={handleEditClient}
                        handleReject={handleRejectClient}
                    />
                )}

            <div className="w-full md:w-2/3 h-[60vh] md:h-[80vh] overflow-y-auto flex flex-col gap-6 bg-white rounded-xl shadow-lg p-6 md:p-8">
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

                <div className="flex flex-col gap-6">
                    {searchedUnits && searchedUnits.length > 0 ? (
                        [...searchedUnits]
                            .sort((a, b) => {
                                const statusOrder: Record<
                                    OperationStatus,
                                    number
                                > = {
                                    [OperationStatus.ACCEPTED]: 1,
                                    [OperationStatus.REVIEW]: 2,
                                    [OperationStatus.REJECTED]: 3,
                                };
                                const statusA = handleUnitStatus(a);
                                const statusB = handleUnitStatus(b);
                                return (
                                    statusOrder[statusA] - statusOrder[statusB]
                                );
                            })
                            .map((unit) => (
                                <UnitCard
                                    key={unit.id}
                                    unit={unit}
                                    unitOperation={getUnitOperation(
                                        unit,
                                        unitsOperations
                                    )}
                                    equipmentsCount={getEquipmentsCount(
                                        unit,
                                        equipments
                                    )}
                                    onEdit={() => handleEditUnit(unit)}
                                    onCancelEdit={() =>
                                        handleCancelEditUnit(unit)
                                    }
                                    onDelete={() => handleModalDeleteUnit(unit)}
                                    onReject={() => handleRejectUnit(unit)}
                                    dataTestId={`unit-card-${unit.id}`}
                                />
                            ))
                    ) : (
                        <Typography
                            element="p"
                            size="lg"
                            dataTestId="unit-not-found"
                            className="justify-center text-center"
                        >
                            {filteredUnits?.length === 0
                                ? "Nenhuma unidade registrada"
                                : "Nenhuma unidade encontrada para o termo pesquisado"}
                        </Typography>
                    )}
                </div>

                <Button onClick={handleAddUnit} data-testid="btn-add-unit">
                    Adicionar unidade
                </Button>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() =>
                    handleCloseModal({ setIsModalOpen, setCurrentModal })
                }
                className="max-w-lg"
            >
                {currentModal === Modals.EDIT_CLIENT && (
                    <EditClientForm
                        originalClient={filteredClient!}
                        setIsModalOpen={setIsModalOpen}
                    />
                )}

                {currentModal === Modals.REJECT_CLIENT && (
                    <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
                        <Typography element="h2" size="title2" className="mb-6">
                            Notas do Físico Médico Responsável
                        </Typography>

                        <Typography element="p" size="lg">
                            {selectedClientInOperation?.note}
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
                    <AddUnitForm
                        clientId={selectedClient.id}
                        setIsModalOpen={setIsModalOpen}
                    />
                )}

                {currentModal === Modals.EDIT_UNIT && selectedUnit && (
                    <EditUnitForm
                        originalUnit={selectedUnit}
                        setIsModalOpen={setIsModalOpen}
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
                                    handleCloseModal({
                                        setIsModalOpen,
                                        setCurrentModal,
                                    });
                                }}
                                className="w-full mt-6"
                                data-testid="btn-cancel-delete-unit"
                            >
                                Cancelar
                            </Button>

                            <Button
                                variant="danger"
                                onClick={() => handleDeleteUnit(selectedUnit)}
                                className="w-full mt-6"
                                data-testid="btn-confirm-delete-unit"
                            >
                                Confirmar
                            </Button>
                        </div>
                    </div>
                )}

                {currentModal === Modals.REJECT_UNIT &&
                    selectedUnit &&
                    unitsOperations && (
                        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
                            <Typography
                                element="h2"
                                size="title2"
                                className="mb-6"
                            >
                                Notas do Físico Médico Responsável
                            </Typography>

                            <Typography element="p" size="lg">
                                {
                                    getUnitOperation(
                                        selectedUnit,
                                        unitsOperations
                                    )?.note
                                }
                            </Typography>

                            <Button
                                onClick={() =>
                                    handleConfirmRejectUnit(selectedUnit)
                                }
                                className="w-full mt-6"
                                data-testid="btn-confirm-reject-client"
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
