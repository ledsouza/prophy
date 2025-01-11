import React from "react";
import { useRouter } from "next/navigation";

import { PencilLine, Trash } from "@phosphor-icons/react";

import { OperationStatus, OperationType } from "@/enums";

import { UnitDTO, UnitOperationDTO } from "@/redux/features/unitApiSlice";

import { Button } from "@/components/common";
import { CardButtons, CardStatus } from "@/components/client";
import { Typography } from "@/components/foundation";

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
    const status = unitOperation
        ? unitOperation.operation_status
        : OperationStatus.ACCEPTED;

    const router = useRouter();

    return (
        <div
            className="bg-light rounded-xl shadow-sm p-6 divide-y-2 hover:ring-1 focus:ring-inset hover:ring-primary"
            data-testid={dataTestId}
        >
            <div className="flex justify-between pb-4">
                <div className="flex flex-col">
                    <Typography element="h3" size="title3">
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
