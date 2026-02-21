"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
    EquipmentDTO,
    useListAllEquipmentsOperationsQuery,
    useListAllEquipmentsQuery,
} from "@/redux/features/equipmentApiSlice";
import {
    UnitDTO,
    useListAllUnitsOperationsQuery,
    useListAllUnitsQuery,
} from "@/redux/features/unitApiSlice";
import { apiSlice } from "@/redux/services/apiSlice";
import { getUnitOperation } from "@/redux/services/helpers";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { getIdFromUrl } from "@/utils/url";
import { ArrowClockwise } from "@phosphor-icons/react";

import {
    AppointmentPanel,
    EquipmentDetails,
    EquipmentPanel,
    ReportPanel,
    UnitDetails,
} from "@/components/client";
import { Button, Modal, Spinner, TabbedResourcePanel } from "@/components/common";
import {
    AddEquipmentForm,
    EditEquipmentForm,
    EditUnitForm,
    ReviewDeleteEquipmentForm,
    ReviewDeleteUnitForm,
} from "@/components/forms";
import { Typography } from "@/components/foundation";
import { ModalDeleteEquipment, ModalDeleteUnit } from "@/components/modals";
import { OperationType } from "@/enums";
import { closeModal, Modals, openModal } from "@/redux/features/modalSlice";

const UNIT_TABS = ["equipments", "appointments", "reports"] as const;
type UnitTabId = (typeof UNIT_TABS)[number];

const getInitialTabId = (tab: string | null): UnitTabId => {
    if (tab && (UNIT_TABS as readonly string[]).includes(tab)) {
        return tab as UnitTabId;
    }

    return "equipments";
};

function UnitPage() {
    const pathname = usePathname();
    const unitId = getIdFromUrl(pathname);
    const searchParams = useSearchParams();
    const router = useRouter();
    const dispatch = useAppDispatch();

    const {
        isModalOpen,
        currentModal,
        selectedUnitOperation,
        selectedEquipment,
        selectedEquipmentOperation,
    } = useAppSelector((state) => state.modal);

    const [selectedUnit, setSelectedUnit] = useState<UnitDTO | null>(null);
    const [filteredEquipmentsByUnit, setFilteredEquipmentsByUnit] = useState<EquipmentDTO[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const { data: units, isLoading: isLoadingUnits, error: errorUnits } = useListAllUnitsQuery();

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
                { type: "Appointment", id: "LIST" },
            ]),
        );
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
    }, [units, unitId, isLoadingUnits, router]);

    // Set filtered equipments
    useEffect(() => {
        if (isLoadingEquipments) return;
        if (!equipments || !selectedUnit) return;

        const AddEquipmentsInOperation =
            equipmentsOperations?.filter(
                (operation) => operation.operation_type === OperationType.ADD,
            ) || [];
        setFilteredEquipmentsByUnit([
            ...equipments.filter((equipment) => equipment.unit === unitId),
            ...AddEquipmentsInOperation,
        ]);
    }, [equipmentsOperations, equipments, selectedUnit, unitId, isLoadingEquipments]);

    if (
        isLoadingUnits ||
        isLoadingUnitOperations ||
        isLoadingEquipments ||
        isLoadingEquipmentsOperations
    ) {
        return <Spinner fullscreen />;
    }

    if (errorUnits || errorUnitsOperations || errorEquipments || errorEquipmentsOperations) {
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
                    Aguarde alguns minutos e tente novamente. Se o problema persistir, entre em
                    contato conosco.
                </Typography>
                <Button onClick={() => router.back()} data-testid="btn-back">
                    Voltar
                </Button>
            </div>
        );
    }

    if (selectedUnit) {
        return (
            <main className="flex flex-col md:flex-row gap-6 px-4 md:px-6 lg:px-8 py-4 min-h-0 flex-1">
                <Button
                    variant="secondary"
                    className="fixed bottom-4 right-4 z-10 shadow-lg px-4 py-2"
                    disabled={isLoadingUnitOperations}
                    onClick={handleUpdateData}
                >
                    <div className="flex items-center gap-2">
                        <ArrowClockwise size="24" />
                        <span className="hidden md:inline">Atualizar</span>
                    </div>
                </Button>

                <UnitDetails
                    unit={selectedUnit}
                    unitOperation={getUnitOperation(selectedUnit, unitsOperations)}
                />

                <TabbedResourcePanel
                    tabs={[
                        {
                            id: "equipments",
                            label: "Equipamentos",
                            render: () => (
                                <EquipmentPanel
                                    filteredEquipmentsByUnit={filteredEquipmentsByUnit}
                                    searchTerm={searchTerm}
                                    onSearchTermChange={setSearchTerm}
                                    onAddEquipment={handleModalAddEquipment}
                                />
                            ),
                        },
                        {
                            id: "appointments",
                            label: "Agendamentos",
                            render: () => <AppointmentPanel unitId={unitId} />,
                        },
                        {
                            id: "reports",
                            label: "Relatórios",
                            render: () => <ReportPanel unitId={unitId} />,
                        },
                    ]}
                    initialTabId={getInitialTabId(searchParams.get("tab"))}
                />

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => dispatch(closeModal())}
                    className={
                        currentModal === Modals.EQUIPMENT_DETAILS
                            ? "w-screen h-screen max-h-screen overflow-y-auto rounded-none sm:rounded-lg sm:max-w-6xl sm:mx-6"
                            : currentModal === Modals.REVIEW_EDIT_EQUIPMENT
                              ? "max-w-6xl mx-6"
                              : "max-w-lg"
                    }
                >
                    {currentModal === Modals.EDIT_UNIT && (
                        <EditUnitForm
                            title="Atualização de dados"
                            description={`Por favor, edite os campos que deseja atualizar,
                            certificando-se de preencher as informações corretamente.`}
                            unit={selectedUnit}
                        />
                    )}

                    {currentModal === Modals.REVIEW_EDIT_UNIT && selectedUnit && (
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

                    {currentModal === Modals.ADD_EQUIPMENT && <AddEquipmentForm unitId={unitId} />}

                    {currentModal === Modals.REVIEW_ADD_EQUIPMENT && selectedEquipmentOperation && (
                        <EditEquipmentForm
                            title="Equipamento requisitado"
                            description={`Verifique as informações. Se identificar algum erro,
                            você pode editá-las ou rejeitá-las completamente.`}
                            reviewMode
                            equipment={selectedEquipmentOperation as EquipmentDTO}
                        />
                    )}

                    {currentModal === Modals.EDIT_EQUIPMENT && selectedEquipment && (
                        <EditEquipmentForm
                            title="Atualização de dados"
                            description="Por favor, edite os campos que deseja atualizar,
                            certificando-se de preencher as informações corretamente."
                            equipment={selectedEquipment}
                        />
                    )}

                    {currentModal === Modals.REVIEW_EDIT_EQUIPMENT &&
                        selectedEquipmentOperation &&
                        selectedEquipment && (
                            <div className="flex flex-row">
                                <EditEquipmentForm
                                    title="Alterações requisitadas"
                                    reviewMode
                                    equipment={selectedEquipmentOperation}
                                />

                                <EditEquipmentForm
                                    title="Informações atuais"
                                    disabled
                                    equipment={selectedEquipment}
                                />
                            </div>
                        )}

                    {currentModal === Modals.DELETE_EQUIPMENT && <ModalDeleteEquipment />}

                    {currentModal === Modals.REVIEW_DELETE_EQUIPMENT &&
                        selectedEquipmentOperation && (
                            <ReviewDeleteEquipmentForm
                                title="O cliente deseja remover este equipamento. Você concorda?"
                                equipmentOperationID={selectedEquipmentOperation.id}
                            />
                        )}

                    {currentModal === Modals.EQUIPMENT_DETAILS && selectedEquipment && (
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
