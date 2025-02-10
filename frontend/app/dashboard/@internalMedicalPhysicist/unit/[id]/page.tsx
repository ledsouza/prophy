"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getUnitOperation } from "@/redux/services/helpers";
import { apiSlice } from "@/redux/services/apiSlice";
import {
    UnitDTO,
    useListAllUnitsOperationsQuery,
    useListAllUnitsQuery,
} from "@/redux/features/unitApiSlice";
import {
    EquipmentDTO,
    useListAllEquipmentsOperationsQuery,
    useListAllEquipmentsQuery,
} from "@/redux/features/equipmentApiSlice";

import { getIdFromUrl } from "@/utils/url";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { ArrowClockwise } from "@phosphor-icons/react";

import { Typography } from "@/components/foundation";
import { Button, Modal, Spinner } from "@/components/common";
import {
    Input,
    EditUnitForm,
    AddEquipmentForm,
    EditEquipmentForm,
} from "@/components/forms";
import {
    UnitDetails,
    EquipmentDetails,
    EquipmentList,
} from "@/components/client";
import { OperationType } from "@/enums";
import { closeModal, Modals, openModal } from "@/redux/features/modalSlice";
import { ModalDeleteEquipment, ModalDeleteUnit } from "@/components/modals";

function UnitPage() {
    const pathname = usePathname();
    const unitId = getIdFromUrl(pathname);
    const router = useRouter();
    const dispatch = useAppDispatch();

    const {
        isModalOpen,
        currentModal,
        selectedUnitOperation,
        selectedEquipment,
    } = useAppSelector((state) => state.modal);

    const [selectedUnit, setSelectedUnit] = useState<UnitDTO | null>(null);
    const [filteredEquipmentsByUnit, setFilteredEquipmentsByUnit] = useState<
        EquipmentDTO[]
    >([]);
    const [searchedEquipments, setSearchedEquipments] = useState<
        EquipmentDTO[]
    >([]);
    const [searchTerm, setSearchTerm] = useState("");

    const {
        data: units,
        isLoading: isLoadingUnits,
        error: errorUnits,
    } = useListAllUnitsQuery();

    const {
        data: unitsOperations,
        isLoading: isLoadingUnitOperations,
        error: errorUnitsOperations,
    } = useListAllUnitsOperationsQuery();

    const {
        data: equipmentsOperations,
        isLoading: isLoadingEquipmentsOperations,
        error: errorEquipmentsOperations,
    } = useListAllEquipmentsOperationsQuery();

    const {
        data: equipments,
        isLoading: isLoadingEquipments,
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

    const handleSearchInputChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setSearchTerm(event.target.value);
    };

    const handleModalAddEquipment = () => {
        dispatch(openModal(Modals.ADD_EQUIPMENT));
    };

    // Set selected unit
    useEffect(() => {
        // Only run when data finished paginating
        if (isLoadingUnits) return;

        // Add null checks to prevent unnecessary renders
        if (!units || !unitId) return;

        const unit = units.find((unit) => unit.id === unitId);

        // When the user update data after unit being accepted to be deleted:
        // Since the data doesn't exist anymore, the user is redirected to the main dashboard
        if (!unit) {
            return router.push("/dashboard");
        }

        setSelectedUnit(unit);
    }, [units, unitId, isLoadingUnits]);

    // Set filtered equipments
    useEffect(() => {
        if (isLoadingEquipments) return;
        if (!equipments || !selectedUnit) return;

        const AddEquipmentsInOperation =
            equipmentsOperations?.filter(
                (operation) => operation.operation_type === OperationType.ADD
            ) || [];
        setFilteredEquipmentsByUnit([
            ...equipments.filter((equipment) => equipment.unit === unitId),
            ...AddEquipmentsInOperation,
        ]);
    }, [equipmentsOperations, equipments, selectedUnit]);

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

    if (
        isLoadingUnits ||
        isLoadingUnitOperations ||
        isLoadingEquipments ||
        isLoadingEquipmentsOperations
    ) {
        return <Spinner fullscreen />;
    }

    if (
        errorUnits ||
        errorUnitsOperations ||
        errorEquipments ||
        errorEquipmentsOperations
    ) {
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

                    <EquipmentList
                        searchedEquipments={searchedEquipments}
                        filteredEquipmentsByUnit={filteredEquipmentsByUnit}
                    />

                    <Button
                        onClick={handleModalAddEquipment}
                        data-testid="btn-add-equipment"
                    >
                        Adicionar equipamento
                    </Button>
                </div>

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => dispatch(closeModal())}
                    className={
                        currentModal === Modals.EQUIPMENT_DETAILS
                            ? "max-w-6xl mx-6"
                            : "max-w-lg"
                    }
                >
                    {currentModal === Modals.EDIT_UNIT && (
                        <EditUnitForm unit={selectedUnit} />
                    )}

                    {currentModal === Modals.REVIEW_EDIT_UNIT &&
                        selectedUnit && (
                            <div className="flex flex-row">
                                <EditUnitForm
                                    title="Alterações requisitadas"
                                    reviewMode
                                    unit={selectedUnitOperation as UnitDTO}
                                />

                                <EditUnitForm
                                    title="Informações atuais"
                                    disabled
                                    unit={selectedUnit}
                                />
                            </div>
                        )}

                    {currentModal === Modals.DELETE_UNIT && <ModalDeleteUnit />}

                    {currentModal === Modals.ADD_EQUIPMENT && (
                        <AddEquipmentForm unitId={unitId} />
                    )}

                    {currentModal === Modals.EDIT_EQUIPMENT &&
                        selectedEquipment && (
                            <EditEquipmentForm
                                originalEquipment={selectedEquipment}
                            />
                        )}

                    {currentModal === Modals.DELETE_EQUIPMENT && (
                        <ModalDeleteEquipment />
                    )}

                    {currentModal === Modals.EQUIPMENT_DETAILS &&
                        selectedEquipment && (
                            <EquipmentDetails
                                equipment={selectedEquipment}
                                onClose={() => dispatch(closeModal())}
                            />
                        )}
                </Modal>
            </main>
        );
    }
}

export default UnitPage;
