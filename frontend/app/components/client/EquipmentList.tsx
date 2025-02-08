import React from "react";

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

type EquipmentListProps = {
    searchedEquipments: EquipmentDTO[];
    filteredEquipmentsByUnit?: EquipmentDTO[];
    OperationStatusOrder?: typeof defaultOperationStatusOrder;
    handleEquipmentStatus: (equipment: EquipmentDTO) => OperationStatus;
    onEditEquipment: (equipment: EquipmentDTO) => void;
    onCancelEquipment: (equipment: EquipmentDTO) => void;
    onDeleteEquipment: (equipment: EquipmentDTO) => void;
    onRejectEquipment: (equipment: EquipmentDTO) => void;
    onDetailsEquipment: (equipment: EquipmentDTO) => void;
    emptyStateMessage?: {
        noEquipmentsRegistered?: string;
        noEquipmentsFound?: string;
    };
};

const EquipmentList = ({
    searchedEquipments,
    filteredEquipmentsByUnit,
    OperationStatusOrder = defaultOperationStatusOrder,
    handleEquipmentStatus,
    onEditEquipment,
    onCancelEquipment,
    onDeleteEquipment,
    onRejectEquipment,
    onDetailsEquipment,
    emptyStateMessage = {
        noEquipmentsRegistered: "Nenhum equipamento registrado",
        noEquipmentsFound:
            "Nenhum equipamento encontrado para o termo pesquisado",
    },
}: EquipmentListProps) => {
    const { data: equipmentsOperations } =
        useListAllEquipmentsOperationsQuery();

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
                        equipmentOperation={getEquipmentOperation(
                            equipment,
                            equipmentsOperations
                        )}
                        onEdit={() => onEditEquipment(equipment)}
                        onCancelEdit={() => onCancelEquipment(equipment)}
                        onDelete={() => onDeleteEquipment(equipment)}
                        onReject={() => onRejectEquipment(equipment)}
                        onDetails={() => onDetailsEquipment(equipment)}
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
                    {filteredEquipmentsByUnit &&
                    filteredEquipmentsByUnit.length === 0
                        ? emptyStateMessage.noEquipmentsRegistered
                        : emptyStateMessage.noEquipmentsFound}
                </Typography>
            )}
        </div>
    );
};

export default EquipmentList;
