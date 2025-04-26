import React, { useEffect } from "react";

import { OperationStatus } from "@/enums";
import { defaultOperationStatusOrder } from "@/constants/ordering";
import { sortByOperationStatus } from "@/utils/sorting";
import { getEquipmentOperation } from "@/redux/services/helpers";
import {
    EquipmentDTO,
    useListAllEquipmentsOperationsQuery,
} from "@/redux/features/equipmentApiSlice";

import { Typography } from "@/components/foundation";
import { EquipmentCard } from "@/components/client";
import { Spinner } from "../common";

type EquipmentListProps = {
    searchedEquipments: EquipmentDTO[];
    filteredEquipmentsByUnit?: EquipmentDTO[];
    OperationStatusOrder?: typeof defaultOperationStatusOrder;
    emptyStateMessage?: {
        noEquipmentsRegistered?: string;
        noEquipmentsFound?: string;
    };
};

const EquipmentList = ({
    searchedEquipments,
    filteredEquipmentsByUnit,
    OperationStatusOrder = defaultOperationStatusOrder,
    emptyStateMessage = {
        noEquipmentsRegistered: "Nenhum equipamento registrado",
        noEquipmentsFound: "Nenhum equipamento encontrado para o termo pesquisado",
    },
}: EquipmentListProps) => {
    const { data: equipmentsOperations, isLoading: isLoadingEquipmentsOperations } =
        useListAllEquipmentsOperationsQuery();

    const handleEquipmentStatus = (equipment: EquipmentDTO): OperationStatus => {
        const equipmentOperation = getEquipmentOperation(equipment, equipmentsOperations);

        if (equipmentOperation) {
            return equipmentOperation.operation_status as OperationStatus;
        } else {
            return OperationStatus.ACCEPTED;
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {searchedEquipments && searchedEquipments.length > 0 ? (
                sortByOperationStatus(
                    searchedEquipments,
                    OperationStatusOrder,
                    handleEquipmentStatus
                ).map((equipment) => (
                    <EquipmentCard
                        key={equipment.id}
                        equipment={equipment}
                        equipmentOperation={getEquipmentOperation(equipment, equipmentsOperations)}
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
                    {filteredEquipmentsByUnit && filteredEquipmentsByUnit.length === 0
                        ? emptyStateMessage.noEquipmentsRegistered
                        : emptyStateMessage.noEquipmentsFound}
                </Typography>
            )}
        </div>
    );
};

export default EquipmentList;
