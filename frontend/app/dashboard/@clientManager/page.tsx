"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { apiSlice } from "@/redux/services/apiSlice";
import {
    getEquipmentsCount,
    getUnitOperation,
    isResponseError,
} from "@/redux/services/helpers";
import {
    ClientOperationDTO,
    useDeleteClientOperationMutation,
    useListAllClientsOperationsQuery,
} from "@/redux/features/clientApiSlice";
import {
    UnitDTO,
    useCreateDeleteUnitOperationMutation,
    useDeleteUnitOperationMutation,
    useListAllUnitsOperationsQuery,
} from "@/redux/features/unitApiSlice";

import { useClientDataLoading } from "@/hooks/use-client-data-loading";
import { OperationStatus, OperationType } from "@/enums";
import { handleCloseModal, Modals } from "@/utils/modal";
import { useAppDispatch } from "@/redux/hooks";

import { ArrowClockwise } from "@phosphor-icons/react";

import { Typography } from "@/components/foundation";
import {
    AddUnitForm,
    EditClientForm,
    EditUnitForm,
    Input,
} from "@/components/forms";
import { Button, Modal, Spinner } from "@/components/common";
import { ClientDetails, UnitCard } from "@/components/client";
import { sortByOperationStatus } from "@/utils/sorting";
import { defaultOperationStatusOrder } from "@/constants/ordering";

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
        equipments,
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

    const handleModalEditClient = () => {
        setCurrentModal(Modals.EDIT_CLIENT);
        setIsModalOpen(true);
    };

    const handleModalRejectClient = () => {
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
                return toast.error(
                    "Algo deu errado. Tente novamente mais tarde."
                );
            }

            setIsModalOpen(false);
            setCurrentModal(null);
        } catch (error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }
    };

    const handleModalAddUnit = () => {
        setCurrentModal(Modals.ADD_UNIT);
        setIsModalOpen(true);
    };

    const handleModalEditUnit = (selectedUnit: UnitDTO) => {
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
                return toast.error(
                    "Algo deu errado. Tente novamente mais tarde."
                );
            }

            toast.success("Requisição cancelada com sucesso!");
        } catch (error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }
    };

    const handleModalDeleteUnit = (selectedUnit: UnitDTO) => {
        setSelectedUnit(selectedUnit);
        setCurrentModal(Modals.DELETE_UNIT);
        setIsModalOpen(true);
    };

    const handleCreateDeleteUnitOperation = async (selectedUnit: UnitDTO) => {
        try {
            const response = await createDeleteUnitOperation(selectedUnit.id);
            if (isResponseError(response)) {
                return toast.error(response.error.data.message);
            }

            toast.success("Requisição enviada com sucesso!");
            setIsModalOpen(false);
            setCurrentModal(null);
        } catch (error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }
    };

    const handleModalRejectUnit = (selectedUnit: UnitDTO) => {
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
                return toast.error(
                    "Algo deu errado. Tente novamente mais tarde."
                );
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
                    (operation) =>
                        operation.operation_type === OperationType.ADD
                ) ?? [];

            const selectedClientID = filteredUnits[0].client;
            const units = [
                ...filteredUnits,
                ...addUnitsInOperation.filter(
                    (operation) => operation.client === selectedClientID
                ),
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
        operation
            ? setSelectedClientInOperation(operation)
            : setSelectedClientInOperation(null);
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

            {clientOptions &&
                selectedClient &&
                filteredClient &&
                clientsOperations && (
                    <ClientDetails
                        title="Informações da instituição"
                        isLoading={isLoadingClientData}
                        clientOptions={clientOptions}
                        selectedClient={selectedClient}
                        setSelectedClient={setSelectedClient}
                        filteredClient={filteredClient}
                        selectedClientInOperation={selectedClientInOperation}
                        handleEdit={handleModalEditClient}
                        handleReject={handleModalRejectClient}
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
                        sortByOperationStatus(
                            searchedUnits,
                            defaultOperationStatusOrder,
                            handleUnitStatus
                        ).map((unit) => (
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
                                onEdit={() => handleModalEditUnit(unit)}
                                onCancelEdit={() => handleCancelEditUnit(unit)}
                                onDelete={() => handleModalDeleteUnit(unit)}
                                onReject={() => handleModalRejectUnit(unit)}
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

                <Button onClick={handleModalAddUnit} data-testid="btn-add-unit">
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
                        title="Atualização de dados"
                        description={`Por favor, edite os campos que deseja atualizar,
                        certificando-se de preencher as informações corretamente.
                        Após a submissão, o formulário será enviado para análise de
                        um físico médico responsável, que fará a revisão e validação
                        das informações fornecidas.`}
                        client={filteredClient!}
                        setIsModalOpen={setIsModalOpen}
                    />
                )}

                {currentModal === Modals.REJECT_CLIENT && (
                    <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
                        <Typography element="h2" size="title2" className="mb-6">
                            Notas do Físico Médico Responsável
                        </Typography>

                        <Typography
                            element="p"
                            size="lg"
                            className="break-words"
                        >
                            {selectedClientInOperation?.note
                                ?.split("\n")
                                .map((line, index) => (
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
                                onClick={() =>
                                    handleCreateDeleteUnitOperation(
                                        selectedUnit
                                    )
                                }
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
