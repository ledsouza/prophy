import React from "react";

import { Typography } from "@/components/foundation";
import { Button } from "@/components/common";
import { EquipmentDTO } from "@/redux/features/equipmentApiSlice";

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
                <Typography element="h3" size="title3">
                    <b>Modelo:</b> {equipment.model}
                    <br />
                    <b>Fabricante:</b> {equipment.manufacturer}
                </Typography>
                <div className="flex flex-col gap-2">
                    <Typography element="h3" size="lg">
                        Status
                    </Typography>
                    <Typography className="text-success">{status}</Typography>
                </div>
            </div>
            <div className="flex gap-10 justify-between pt-4">
                <Typography dataTestId="equipments-counts">
                    <b>Modalidade:</b> {equipment.modality}
                </Typography>
            </div>
        </div>
    );
}

export default EquipmentCard;
