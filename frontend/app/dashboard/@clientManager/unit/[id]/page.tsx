"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
    getUnitOperation,
    isErrorWithMessage,
    isResponseError,
} from "@/redux/services/helpers";
import { apiSlice } from "@/redux/services/apiSlice";
import {
    UnitDTO,
    useCreateUnitMutation,
    useDeleteUnitOperationMutation,
    useListAllUnitsOperationsQuery,
    useListAllUnitsQuery,
} from "@/redux/features/unitApiSlice";
import {
    EquipmentDTO,
    useListAllEquipmentsQuery,
} from "@/redux/features/equipmentApiSlice";

import { toast } from "react-toastify";
import { getIdFromUrl } from "@/utils/url";
import { handleCloseModal, Modals } from "@/utils/modal";
import { useAppDispatch } from "@/redux/hooks";
import { ArrowClockwise } from "@phosphor-icons/react";

import { Typography } from "@/components/foundation";
import { Button, Modal, Spinner } from "@/components/common";
import { Input, EditUnitForm } from "@/components/forms";
import {
    UnitDetails,
    EquipmentCard,
    EquipmentDetails,
} from "@/components/client";
import { OperationType } from "@/enums";

function UnitPage() {
    const pathname = usePathname();
    const unitId = getIdFromUrl(pathname);
    const router = useRouter();
    const dispatch = useAppDispatch();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentModal, setCurrentModal] = useState<Modals | null>(null);

    const [selectedUnit, setSelectedUnit] = useState<UnitDTO | null>(null);
    const [selectedEquipment, setSelectedEquipment] =
        useState<EquipmentDTO | null>(null);
    const [filteredEquipmentsByUnit, setFilteredEquipmentsByUnit] = useState<
        EquipmentDTO[]
    >([]);
    const [searchedEquipments, setSearchedEquipments] = useState<
        EquipmentDTO[]
    >([]);
    const [searchTerm, setSearchTerm] = useState("");

    const {
        data: units,
        isLoading: isPaginatingUnits,
        error: errorUnits,
    } = useListAllUnitsQuery();
    const { data: unitsOperations, isLoading: isLoadingUnitOperations } =
        useListAllUnitsOperationsQuery();
    const [createUnitOperation] = useCreateUnitMutation();
    const [deleteUnitOperation] = useDeleteUnitOperationMutation();

    const {
        data: equipments,
        isLoading: isPaginatingEquipments,
        error: errorEquipments,
    } = useListAllEquipmentsQuery();

    const handleUpdateData = () => {
        dispatch(
            apiSlice.util.invalidateTags([
                { type: "Unit", id: "LIST" },
                { type: "UnitOperation", id: "LIST" },
                { type: "Equipment", id: "LIST" },
                { type: "EquipmentOperation", id: "LIST" },
            ])
        );
    };

    function handleClickEquipmentCard(equipment: EquipmentDTO) {
        setSelectedEquipment(equipment);
        setCurrentModal(Modals.EQUIPMENT_DETAILS);
        setIsModalOpen(true);
    }

    const handleSearchInputChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setSearchTerm(event.target.value);
    };

    const handleEditUnit = () => {
        setCurrentModal(Modals.EDIT_UNIT);
        setIsModalOpen(true);
    };

    const handleRejectUnit = () => {
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

    const handleModalDeleteUnit = () => {
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
            if (isErrorWithMessage(response.error)) {
                return toast.error(response.error.data.messages[0]);
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

    // Set selected unit and filtered equipments
    useEffect(() => {
        // Only run when both data finished paginating
        if (isPaginatingUnits || isPaginatingEquipments) return;

        // Add null checks to prevent unnecessary renders
        if (!units || !equipments || !unitId) return;

        const unit = units.find((unit) => unit.id === unitId);

        // When the user update data after unit being accepted to be deleted:
        // Since the data doesn't exist anymore, the user is redirected to the main dashboard
        if (!unit) {
            return router.push("/dashboard");
        }

        setSelectedUnit(unit);
        setFilteredEquipmentsByUnit(
            equipments.filter((equipment) => equipment.unit === unitId)
        );
    }, [units, equipments, unitId, isPaginatingUnits, isPaginatingEquipments]);

    // Filter equipments by search term
    useEffect(() => {
        if (filteredEquipmentsByUnit.length > 0) {
            if (searchTerm.length > 0) {
                setSearchedEquipments(
                    filteredEquipmentsByUnit.filter((equipment) =>
                        equipment.model
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                    )
                );
            } else {
                setSearchedEquipments(filteredEquipmentsByUnit);
            }
        } else {
            setSearchedEquipments([]);
        }
    }, [filteredEquipmentsByUnit, searchTerm]);

    if (isPaginatingUnits || isPaginatingEquipments) {
        return <Spinner fullscreen />;
    }

    if (errorUnits || errorEquipments) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-8">
                <Typography
                    element="h2"
                    size="title2"
                    className="font-bold"
                    dataTestId="data-not-found"
                >
                    Ocorreu um problema ao carregar os dados.
                </Typography>
                <Typography element="p" size="lg">
                    Aguarde alguns minutos e tente novamente. Se o problema
                    persistir, entre em contato conosco.
                </Typography>
                <Button onClick={() => router.back()} data-testid="btn-back">
                    Voltar
                </Button>
            </div>
        );
    }

    if (selectedUnit) {
        return (
            <main className="flex flex-col md:flex-row gap-6 px-4 md:px-6 lg:px-8 py-4">
                <Button
                    variant="secondary"
                    className="fixed bottom-4 right-4 z-10 shadow-lg px-4 py-2"
                    disabled={isLoadingUnitOperations}
                    onClick={handleUpdateData}
                >
                    <div className="flex items-center gap-2">
                        <ArrowClockwise size="24" /> Atualizar
                    </div>
                </Button>

                <UnitDetails
                    unit={selectedUnit}
                    unitOperation={getUnitOperation(
                        selectedUnit,
                        unitsOperations
                    )}
                    onEdit={handleEditUnit}
                    onDelete={handleModalDeleteUnit}
                    onReject={handleRejectUnit}
                />

                <div className="w-full md:w-2/3 h-[60vh] md:h-[80vh] overflow-y-auto flex flex-col gap-6 bg-white rounded-xl shadow-lg p-6 md:p-8">
                    <Typography
                        element="h2"
                        size="title2"
                        className="font-bold"
                    >
                        Equipamentos
                    </Typography>

                    {filteredEquipmentsByUnit?.length !== 0 && (
                        <Input
                            placeholder="Buscar equipamentos por modelo"
                            value={searchTerm}
                            onChange={handleSearchInputChange}
                            dataTestId="input-search-equipments"
                        />
                    )}

                    <div className="flex flex-col gap-6">
                        {searchedEquipments.length > 0 ? (
                            searchedEquipments.map((equipment) => (
                                <EquipmentCard
                                    key={equipment.id}
                                    equipment={equipment}
                                    status="Aceito"
                                    onClick={() =>
                                        handleClickEquipmentCard(equipment)
                                    }
                                    dataTestId={`equipment-card-${equipment.id}`}
                                />
                            ))
                        ) : (
                            <Typography
                                element="p"
                                size="lg"
                                dataTestId="equipment-not-found"
                                className="justify-center text-center"
                            >
                                {filteredEquipmentsByUnit?.length === 0
                                    ? "Nenhum equipamento registrado"
                                    : "Nenhum equipamento encontrado para o termo pesquisado"}
                            </Typography>
                        )}
                    </div>

                    <Button data-testid="btn-add-equipment">
                        Adicionar equipamento
                    </Button>
                </div>

                <Modal
                    isOpen={isModalOpen}
                    onClose={() =>
                        handleCloseModal({ setIsModalOpen, setCurrentModal })
                    }
                    className={
                        currentModal === Modals.EQUIPMENT_DETAILS
                            ? "max-w-6xl mx-6"
                            : "max-w-lg"
                    }
                >
                    {currentModal === Modals.EDIT_UNIT && (
                        <EditUnitForm
                            originalUnit={selectedUnit}
                            setIsModalOpen={setIsModalOpen}
                        />
                    )}

                    {currentModal === Modals.REJECT_UNIT && (
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

                    {currentModal === Modals.DELETE_UNIT && selectedUnit && (
                        <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
                            <Typography
                                element="h2"
                                size="title2"
                                className="mb-6"
                            >
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
                                        handleDeleteUnit(selectedUnit)
                                    }
                                    className="w-full mt-6"
                                    data-testid="btn-confirm-delete-unit"
                                >
                                    Confirmar
                                </Button>
                            </div>
                        </div>
                    )}

                    {currentModal === Modals.EQUIPMENT_DETAILS &&
                        selectedEquipment && (
                            <EquipmentDetails
                                equipment={selectedEquipment}
                                onClose={() =>
                                    handleCloseModal({
                                        setIsModalOpen,
                                        setCurrentModal,
                                    })
                                }
                            />
                        )}
                </Modal>
            </main>
        );
    }
}

export default UnitPage;
