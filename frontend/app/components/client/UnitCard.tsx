import React, { useEffect, useState } from "react";
import cn from "classnames";

import { useRouter } from "next/navigation";

import { OperationStatus } from "@/enums";

import { UnitDTO, UnitOperationDTO } from "@/redux/features/unitApiSlice";

import { CardButtons, CardStatus } from "@/components/client";
import { Typography } from "@/components/foundation";
import { useListAllEquipmentsOperationsQuery } from "@/redux/features/equipmentApiSlice";

type UnitCardProps = {
    unit: UnitDTO;
    unitOperation: UnitOperationDTO | undefined;
    equipmentsCount: number;
    onEdit: () => void;
    onCancelEdit: () => void;
    onDelete: () => void;
    onReject: () => void;
    dataTestId?: string | undefined;
};

function UnitCard({
    unit,
    unitOperation,
    equipmentsCount,
    onEdit,
    onCancelEdit,
    onDelete,
    onReject,
    dataTestId,
}: UnitCardProps) {
    const [status, setStatus] = useState<OperationStatus>();
    const [hasOperation, setHasOperation] = useState(false);

    const router = useRouter();

    const { data: equipmentOperations } = useListAllEquipmentsOperationsQuery();

    const containerStyle = cn(
        "bg-light rounded-xl shadow-sm p-6 divide-y-2 hover:ring-1 focus:ring-inset hover:ring-primary",
        {
            "animate-warning": hasOperation,
        }
    );

    useEffect(() => {
        setStatus(
            unitOperation
                ? unitOperation.operation_status
                : OperationStatus.ACCEPTED
        );
    }, [unitOperation]);

    useEffect(() => {
        const unitIDsFromEquipmentOps = equipmentOperations?.map(
            (operation) => operation.unit
        );
        if (
            status === OperationStatus.REVIEW ||
            status === OperationStatus.REJECTED ||
            unitIDsFromEquipmentOps?.includes(unit.id)
        ) {
            setHasOperation(true);
        } else {
            setHasOperation(false);
        }
    }, [status, equipmentOperations]);

    return (
        <div className={containerStyle} data-testid={dataTestId}>
            <div className="flex justify-between pb-4">
                <div className="flex flex-col">
                    <Typography
                        element="h3"
                        size="title3"
                        dataTestId="unit-name"
                    >
                        {unit.name}
                    </Typography>

                    <Typography dataTestId="equipments-counts">
                        Quantidade de Equipamentos:{" "}
                        <Typography element="span" className="font-semibold">
                            {String(equipmentsCount)}
                        </Typography>
                    </Typography>
                </div>

                <div className="flex flex-col gap-2">
                    <Typography element="h3" size="lg" className="text-right">
                        Status
                    </Typography>

                    <CardStatus status={status} />
                </div>
            </div>

            <div className="flex gap-10 justify-between pt-4">
                <CardButtons
                    operation={unitOperation}
                    status={status}
                    onDetails={() => router.push(`/dashboard/unit/${unit.id}`)}
                    onCancelEdit={onCancelEdit}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onReject={onReject}
                />
            </div>
        </div>
    );
}

export default UnitCard;
