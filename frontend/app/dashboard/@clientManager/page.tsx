"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
    UnitDTO,
    useDeleteUnitOperationMutation,
    useListAllUnitsOperationsQuery,
} from "@/redux/features/unitApiSlice";

import { useClientDataLoading } from "@/hooks/use-client-data-loading";

import { EditClientForm, Input } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { Button, Modal, Spinner } from "@/components/common";
import { ClientDetails, UnitCard } from "@/components/client";
import {
    ClientOperationDTO,
    useDeleteClientOperationMutation,
    useListAllClientsOperationsQuery,
} from "@/redux/features/clientApiSlice";
import { isResponseError } from "@/redux/services/helpers";
import { toast } from "react-toastify";
import EditUnitForm from "@/components/forms/EditUnitForm";
import { OperationStatus } from "@/enums/OperationStatus";

enum Modals {
    EDIT_CLIENT = "EDIT_CLIENT",
    REJECT_CLIENT = "REJECT_CLIENT",
    EDIT_UNIT = "EDIT_UNIT",
    REJECT_UNIT = "REJECT_UNIT",
}

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

    const handleEditUnit = (selectedUnit: UnitDTO) => {
        setSelectedUnit(selectedUnit);
        setCurrentModal(Modals.EDIT_UNIT);
        setIsModalOpen(true);
    };

    const handleCancelEditUnit = async (selectedUnit: UnitDTO) => {
        const unitOperation = getUnitOperation(selectedUnit);

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

    const handleRejectUnit = (selectedUnit: UnitDTO) => {
        setSelectedUnit(selectedUnit);
        setCurrentModal(Modals.REJECT_UNIT);
        setIsModalOpen(true);
    };

    const handleConfirmRejectUnit = async (selectedUnit: UnitDTO) => {
        const unitOperation = getUnitOperation(selectedUnit);

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

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentModal(null);
    };

    const handleUnitStatus = (unit: UnitDTO): OperationStatus => {
        const unitOperation = getUnitOperation(unit);

        if (unitOperation) {
            return unitOperation.operation_status as OperationStatus;
        } else {
            return OperationStatus.ACCEPTED;
        }
    };

    const getUnitOperation = (unit: UnitDTO) => {
        return unitsOperations?.find(
            (operation) => operation.original_unit === unit.id
        );
    };

    const getEquipmentsCount = (unit: UnitDTO) => {
        if (equipments) {
            return equipments.filter((equipment) => equipment.unit === unit.id)
                .length;
        } else {
            return 0;
        }
    };

    // Filter units by search term
    useEffect(() => {
        if (filteredUnits && filteredUnits.length > 0) {
            if (searchTerm.length > 0) {
                setSearchedUnits(
                    filteredUnits.filter((unit) =>
                        unit.name
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                    )
                );
            } else {
                setSearchedUnits(filteredUnits);
            }
        } else {
            setSearchedUnits([]);
        }
    }, [filteredUnits, searchTerm]);

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
                                    title={unit.name}
                                    status={handleUnitStatus(unit)}
                                    equipmentsCount={getEquipmentsCount(unit)}
                                    onEdit={() => handleEditUnit(unit)}
                                    onCancelEdit={() =>
                                        handleCancelEditUnit(unit)
                                    }
                                    onReject={() => handleRejectUnit(unit)}
                                    handleDetails={() =>
                                        router.push(
                                            `/dashboard/unit/${unit.id}`
                                        )
                                    }
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

                <Button data-testid="btn-add-unit">Adicionar unidade</Button>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
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

                {currentModal === Modals.EDIT_UNIT && (
                    <EditUnitForm
                        originalUnit={selectedUnit!}
                        setIsModalOpen={setIsModalOpen}
                    />
                )}

                {currentModal === Modals.REJECT_UNIT && (
                    <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
                        <Typography element="h2" size="title2" className="mb-6">
                            Notas do Físico Médico Responsável
                        </Typography>

                        <Typography element="p" size="lg">
                            {getUnitOperation(selectedUnit!)?.note}
                        </Typography>

                        <Button
                            onClick={() =>
                                handleConfirmRejectUnit(selectedUnit!)
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
