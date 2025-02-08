import React from "react";

import { OperationStatus } from "@/enums";
import { defaultOperationStatusOrder } from "@/constants/ordering";

import { getEquipmentsCount, getUnitOperation } from "@/redux/services/helpers";
import {
    UnitDTO,
    useListAllUnitsOperationsQuery,
} from "@/redux/features/unitApiSlice";
import { useListAllEquipmentsQuery } from "@/redux/features/equipmentApiSlice";

import { sortByOperationStatus } from "@/utils/sorting";

import { UnitCard } from "@/components/client";
import { Typography } from "@/components/foundation";

type UnitListProps = {
    searchedUnits: UnitDTO[];
    filteredUnits?: UnitDTO[];
    OperationStatusOrder?: typeof defaultOperationStatusOrder;
    emptyStateMessage?: {
        noUnitsRegistered?: string;
        noUnitsFound?: string;
    };
};

const UnitList = ({
    searchedUnits,
    filteredUnits,
    OperationStatusOrder = defaultOperationStatusOrder,
    emptyStateMessage = {
        noUnitsRegistered: "Nenhuma unidade registrada",
        noUnitsFound: "Nenhuma unidade encontrada para o termo pesquisado",
    },
}: UnitListProps) => {
    const { data: unitsOperations } = useListAllUnitsOperationsQuery();
    const { data: equipments } = useListAllEquipmentsQuery();

    const handleUnitStatus = (unit: UnitDTO): OperationStatus => {
        const unitOperation = getUnitOperation(unit, unitsOperations);

        if (unitOperation) {
            return unitOperation.operation_status as OperationStatus;
        } else {
            return OperationStatus.ACCEPTED;
        }
    };

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
