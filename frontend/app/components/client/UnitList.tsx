import React from "react";

import { OperationStatus } from "@/enums";
import { defaultOperationStatusOrder } from "@/constants/ordering";

import { getEquipmentsCount } from "@/redux/services/helpers";
import {
    UnitDTO,
    useListAllUnitsOperationsQuery,
} from "@/redux/features/unitApiSlice";
import { useListAllEquipmentsQuery } from "@/redux/features/equipmentApiSlice";

import { sortByOperationStatus } from "@/utils/sorting";
import { buildUnitListItems } from "@/utils/unit-operations";

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
    const unitListItems = buildUnitListItems(searchedUnits, unitsOperations);

    const handleUnitStatus = ({ operation }: (typeof unitListItems)[number]): OperationStatus => {
        if (operation) {
            return operation.operation_status as OperationStatus;
        }

        return OperationStatus.ACCEPTED;
    };

    return (
        <div className="flex flex-col gap-6">
            {unitListItems.length > 0 ? (
                sortByOperationStatus(
                    unitListItems,
                    OperationStatusOrder,
                    handleUnitStatus
                ).map(({ unit, operation }) => (
                    <UnitCard
                        key={unit.id}
                        unit={unit}
                        unitOperation={operation}
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
