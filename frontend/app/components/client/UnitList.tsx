import React from "react";

import { UnitCard } from "@/components/client";
import { Typography } from "@/components/foundation";
import { sortByOperationStatus } from "@/utils/sorting";
import { getEquipmentsCount, getUnitOperation } from "@/redux/services/helpers";
import {
    UnitDTO,
    useListAllUnitsOperationsQuery,
} from "@/redux/features/unitApiSlice";
import { useListAllEquipmentsQuery } from "@/redux/features/equipmentApiSlice";
import { defaultOperationStatusOrder } from "@/constants/ordering";
import { OperationStatus } from "@/enums";

type UnitListProps = {
    searchedUnits: UnitDTO[];
    filteredUnits?: UnitDTO[];
    OperationStatusOrder?: typeof defaultOperationStatusOrder;
    handleUnitStatus: (unit: UnitDTO) => OperationStatus;
    onEditUnit: (unit: UnitDTO) => void;
    onCancelEditUnit: (unit: UnitDTO) => void;
    onDeleteUnit: (unit: UnitDTO) => void;
    onRejectUnit: (unit: UnitDTO) => void;
    emptyStateMessage?: {
        noUnitsRegistered?: string;
        noUnitsFound?: string;
    };
};

const UnitList = ({
    searchedUnits,
    filteredUnits,
    OperationStatusOrder = defaultOperationStatusOrder,
    handleUnitStatus,
    onEditUnit,
    onCancelEditUnit,
    onDeleteUnit,
    onRejectUnit,
    emptyStateMessage = {
        noUnitsRegistered: "Nenhuma unidade registrada",
        noUnitsFound: "Nenhuma unidade encontrada para o termo pesquisado",
    },
}: UnitListProps) => {
    const { data: unitsOperations } = useListAllUnitsOperationsQuery();
    const { data: equipments } = useListAllEquipmentsQuery();

    return (
        <div className="flex flex-col gap-6">
            {searchedUnits && searchedUnits.length > 0 ? (
                sortByOperationStatus(
                    searchedUnits,
                    OperationStatusOrder,
                    handleUnitStatus
                ).map((unit) => (
                    <UnitCard
                        key={unit.id}
                        unit={unit}
                        unitOperation={getUnitOperation(unit, unitsOperations)}
                        equipmentsCount={getEquipmentsCount(unit, equipments)}
                        onEdit={() => onEditUnit(unit)}
                        onCancelEdit={() => onCancelEditUnit(unit)}
                        onDelete={() => onDeleteUnit(unit)}
                        onReject={() => onRejectUnit(unit)}
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
                    {filteredUnits && filteredUnits.length === 0
                        ? emptyStateMessage.noUnitsRegistered
                        : emptyStateMessage.noUnitsFound}
                </Typography>
            )}
        </div>
    );
};

export default UnitList;
