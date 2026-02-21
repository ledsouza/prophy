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
import { ArrowClockwiseIcon } from "@phosphor-icons/react";

import {
    AppointmentPanel,
    EquipmentDetails,
    EquipmentPanel,
    ReportPanel,
    UnitDetails,
} from "@/components/client";
import { Button, Modal, Spinner, TabbedResourcePanel } from "@/components/common";
import { Typography } from "@/components/foundation";
import { OperationType } from "@/enums";
import { closeModal, Modals } from "@/redux/features/modalSlice";

const UNIT_TABS = ["equipments", "appointments", "reports"] as const;
type UnitTabId = (typeof UNIT_TABS)[number];

const getInitialTabId = (tab: string | null): UnitTabId => {
    if (tab && (UNIT_TABS as readonly string[]).includes(tab)) {
        return tab as UnitTabId;
    }

    return "equipments";
};

function CommercialUnitPage() {
    const pathname = usePathname();
    const unitId = getIdFromUrl(pathname);
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();

    const { isModalOpen, currentModal, selectedEquipment } = useAppSelector((state) => state.modal);

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

    // Set selected unit
    useEffect(() => {
        if (isLoadingUnits) return;
        if (!units || !unitId) return;

        const unit = units.find((u) => u.id === unitId);
        if (!unit) {
            router.push("/dashboard");
            return;
        }

        setSelectedUnit(unit);
    }, [units, unitId, isLoadingUnits, router]);

    // Set filtered equipments
    useEffect(() => {
        if (isLoadingEquipments) return;
        if (!equipments || !selectedUnit) return;

        const addEquipmentsInOperation =
            equipmentsOperations?.filter(
                (operation) => operation.operation_type === OperationType.ADD,
            ) || [];

        setFilteredEquipmentsByUnit([
            ...equipments.filter((equipment) => equipment.unit === unitId),
            ...addEquipmentsInOperation,
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

    if (!selectedUnit) {
        return null;
    }

    return (
        <main className="flex flex-col md:flex-row gap-6 px-4 md:px-6 lg:px-8 py-4 min-h-0 flex-1">
            <Button
                variant="secondary"
                className="fixed bottom-4 right-4 z-10 shadow-lg px-4 py-2"
                disabled={isLoadingUnitOperations}
                onClick={handleUpdateData}
            >
                <div className="flex items-center gap-2">
                    <ArrowClockwiseIcon size="24" />
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
                                onAddEquipment={() => {}}
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
                    currentModal === Modals.EQUIPMENT_DETAILS ? "max-w-6xl mx-6" : "max-w-lg"
                }
            >
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

export default CommercialUnitPage;
