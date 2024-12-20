import React from "react";

import { Typography } from "@/components/foundation";
import { Button } from "@/components/common";
import { EquipmentDTO } from "@/redux/features/equipmentApiSlice";
import { PencilLine, Trash } from "@phosphor-icons/react";

type EquipmentCardProps = {
    equipment: EquipmentDTO;
    status: string;
    dataTestId?: string | undefined;
    onClick?: () => void;
};

function EquipmentCard({
    equipment,
    status,
    dataTestId,
    onClick,
}: EquipmentCardProps) {
    return (
        <div
            className="bg-light rounded-xl shadow-sm p-6 divide-y-2 hover:ring-1 focus:ring-inset hover:ring-primary cursor-pointer"
            data-testid={dataTestId}
            onClick={onClick}
        >
            <div className="flex justify-between pb-4">
                <div className="flex flex-col">
                    <Typography element="h3" size="title3">
                        {equipment.model}
                    </Typography>
                    <Typography element="p" size="lg">
                        {equipment.manufacturer}
                    </Typography>
                </div>
                <div className="flex flex-col gap-2">
                    <Typography element="h3" size="lg">
                        Status
                    </Typography>
                    <Typography className="text-success">{status}</Typography>
                </div>
            </div>
            <div className="flex gap-10 justify-between pt-4">
                <Typography dataTestId="equipments-counts">
                    {equipment.modality}
                </Typography>

                <div className="flex flex-row gap-2">
                    <Button
                        variant="secondary"
                        data-testid="btn-edit-equipment"
                    >
                        <PencilLine size={20} />
                    </Button>
                    <Button variant="danger" data-testid="btn-delete-equipment">
                        <Trash size={20} />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default EquipmentCard;
