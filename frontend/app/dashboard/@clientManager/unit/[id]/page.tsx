"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getIdFromUrl } from "@/utils/url";
import {
    UnitDTO,
    useDeleteUnitOperationMutation,
    useListAllUnitsOperationsQuery,
    useListAllUnitsQuery,
} from "@/redux/features/unitApiSlice";
import {
    EquipmentDTO,
    useListAllEquipmentsQuery,
} from "@/redux/features/equipmentApiSlice";

import { Input } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { Button, Modal, Spinner } from "@/components/common";
import {
    UnitDetails,
    EquipmentCard,
    EquipmentDetails,
} from "@/components/client";
import EditUnitForm from "@/components/forms/EditUnitForm";
import { handleCloseModal, Modals } from "@/utils/modal";
import { getUnitOperation, isResponseError } from "@/redux/services/helpers";
import { toast } from "react-toastify";

function UnitPage() {
    const pathname = usePathname();
    const unitId = getIdFromUrl(pathname);
    const router = useRouter();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentModal, setCurrentModal] = useState<Modals | null>(null);
    const [selectedEquipment, setSelectedEquipment] =
        useState<EquipmentDTO | null>(null);

    const {
        data: units,
        isLoading: isPaginatingUnits,
        error: errorUnits,
    } = useListAllUnitsQuery();

    const { data: unitsOperations, isLoading: isLoadingUnitOperations } =
        useListAllUnitsOperationsQuery();

    const [deleteUnitOperation] = useDeleteUnitOperationMutation();

    const {
        data: equipments,
        isLoading: isPaginatingEquipments,
        error: errorEquipments,
    } = useListAllEquipmentsQuery();

    const [selectedUnit, setSelectedUnit] = useState<UnitDTO | undefined>(
        undefined
    );
    const [filteredEquipments, setFilteredEquipments] = useState<
        EquipmentDTO[]
    >([]);

    const [searchedEquipments, setSearchedEquipments] = useState<
        EquipmentDTO[]
    >([]);
    const [searchTerm, setSearchTerm] = useState("");

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

    // Set selected unit and filtered equipments
    useEffect(() => {
        // Only run when both data finished paginating
        if (isPaginatingUnits || isPaginatingEquipments) return;

        // Add null checks to prevent unnecessary renders
        if (!units?.length || !equipments?.length || !unitId) return;

        setSelectedUnit(units.find((unit) => unit.id === unitId));
        setFilteredEquipments(
            equipments.filter((equipment) => equipment.unit === unitId)
        );
    }, [units, equipments, unitId, isPaginatingUnits, isPaginatingEquipments]);

    // Filter equipments by search term
    useEffect(() => {
        if (filteredEquipments.length > 0) {
            if (searchTerm.length > 0) {
                setSearchedEquipments(
                    filteredEquipments.filter((equipment) =>
                        equipment.model
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                    )
                );
            } else {
                setSearchedEquipments(filteredEquipments);
            }
        } else {
            setSearchedEquipments([]);
        }
    }, [filteredEquipments, searchTerm]);

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
                <UnitDetails selectedUnit={selectedUnit} />

                <div className="w-full md:w-2/3 h-[60vh] md:h-[80vh] overflow-y-auto flex flex-col gap-6 bg-white rounded-xl shadow-lg p-6 md:p-8">
                    <Typography
                        element="h2"
                        size="title2"
                        className="font-bold"
                    >
                        Equipamentos
                    </Typography>

                    {filteredEquipments?.length !== 0 && (
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
                                {filteredEquipments?.length === 0
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
                    className="max-w-lg"
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
                </Modal>

                <Modal
                    isOpen={isModalOpen}
                    onClose={() =>
                        handleCloseModal({ setIsModalOpen, setCurrentModal })
                    }
                    className="max-w-6xl mx-6"
                >
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
