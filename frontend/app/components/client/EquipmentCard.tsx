import React, { useEffect, useState } from "react";
import cn from "classnames";

import { OperationStatus } from "@/enums";

import {
    EquipmentDTO,
    EquipmentOperationDTO,
} from "@/redux/features/equipmentApiSlice";

import { Typography } from "@/components/foundation";
import { CardButtons, CardStatus } from "@/components/client";

type EquipmentCardProps = {
    equipment: EquipmentDTO;
    equipmentOperation: EquipmentOperationDTO | undefined;
    onDetails: () => void;
    onEdit: () => void;
    onCancelEdit: () => void;
    onDelete: () => void;
    onReject: () => void;
    dataTestId?: string | undefined;
};

function EquipmentCard({
    equipment,
    equipmentOperation,
    dataTestId,
    onDetails,
    onEdit,
    onCancelEdit,
    onDelete,
    onReject,
}: EquipmentCardProps) {
    const [status, setStatus] = useState<OperationStatus>();
    const [hasOperation, setHasOperation] = useState(false);
    const [isRejected, setIsRejected] = useState(false);

    const containerStyle = cn(
        "bg-light rounded-xl shadow-sm p-6 divide-y-2 hover:ring-1 focus:ring-inset hover:ring-primary",
        {
            "animate-warning": hasOperation,
            "animate-danger": isRejected,
        }
    );

    useEffect(() => {
        setStatus(
            equipmentOperation
                ? equipmentOperation.operation_status
                : OperationStatus.ACCEPTED
        );
    }, [equipmentOperation]);

    useEffect(() => {
        if (status === OperationStatus.REJECTED) {
            setHasOperation(false);
            setIsRejected(true);
        } else if (status === OperationStatus.REVIEW) {
            setHasOperation(true);
            setIsRejected(false);
        } else {
            setHasOperation(false);
            setIsRejected(false);
        }
    }, [status]);

    useEffect(() => {
        console.log("setIsRejected:", isRejected);
    }, [isRejected]);

    return (
        <div className={containerStyle} data-testid={dataTestId}>
            <div className="flex justify-between pb-4">
                <div className="flex flex-col">
                    <Typography element="h3" size="title3">
                        {equipment.model}
                    </Typography>
                    <Typography element="p" size="lg">
                        {equipment.manufacturer}
                    </Typography>
                    <Typography dataTestId="equipments-counts">
                        {equipment.modality}
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
                    operation={equipmentOperation}
                    status={status}
                    onDetails={onDetails}
                    onCancelEdit={onCancelEdit}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onReject={onReject}
                />
            </div>
        </div>
    );
}

export default EquipmentCard;
