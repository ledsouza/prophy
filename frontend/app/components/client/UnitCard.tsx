import React from "react";

import { UnitDTO } from "@/redux/features/unitApiSlice";

import { PencilLine, Trash } from "@phosphor-icons/react";

import { Typography } from "@/components/foundation";
import { Button } from "@/components/common";

type UnitCardProps = {
    title: string;
    status: string;
    equipmentsCount: number;
    onEdit: () => void;
    dataTestId?: string | undefined;
    handleDetails: () => void;
};

function UnitCard({
    title,
    status,
    equipmentsCount,
    onEdit,
    dataTestId,
    handleDetails,
}: UnitCardProps) {
    return (
        <div
            className="bg-light rounded-xl shadow-sm p-6 divide-y-2 hover:ring-1 focus:ring-inset hover:ring-primary"
            data-testid={dataTestId}
        >
            <div className="flex justify-between pb-4">
                <div className="flex flex-col">
                    <Typography element="h3" size="title3">
                        {title}
                    </Typography>

                    <Typography dataTestId="equipments-counts">
                        Quantidade de Equipamentos:{" "}
                        <Typography element="span" className="font-semibold">
                            {String(equipmentsCount)}
                        </Typography>
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
                <Button
                    variant="secondary"
                    data-testid="btn-unit-detail"
                    onClick={handleDetails}
                >
                    Acessar detalhes
                </Button>

                <div className="flex flex-row justify-between gap-2">
                    <Button
                        variant="secondary"
                        onClick={onEdit}
                        data-testid="btn-edit-unit"
                    >
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
