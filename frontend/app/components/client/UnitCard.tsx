import React from "react";

import { PencilLine, Trash } from "@phosphor-icons/react";
import { Typography } from "@/components/foundation";
import { Button } from "@/components/common";

type UnitCardProps = {
    title: string;
    status: string;
    equipmentsCount: number;
    dataTestId?: string | undefined;
    onClick?: () => void;
};

function UnitCard({
    title,
    status,
    equipmentsCount,
    dataTestId,
    onClick,
}: UnitCardProps) {
    return (
        <div
            className="bg-light rounded-xl shadow-sm p-6 divide-y-2 hover:ring-1 focus:ring-inset hover:ring-primary cursor-pointer"
            data-testid={dataTestId}
            onClick={onClick}
        >
            <div className="flex justify-between pb-4">
                <Typography element="h3" size="title3">
                    {title}
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
                    Quantidade de Equipamentos:{" "}
                    <Typography element="span" className="font-semibold">
                        {String(equipmentsCount)}
                    </Typography>
                </Typography>

                <div className="flex flex-row gap-2">
                    <Button variant="secondary" data-testid="btn-edit-unit">
                        <PencilLine size={20} />
                    </Button>
                    <Button variant="danger" data-testid="btn-delete-unit">
                        <Trash size={20} />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default UnitCard;
