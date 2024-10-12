import React from "react";

import { Typography } from "@/components/foundation";
import { Button } from "@/components/common";

type UnitCardProps = {
    title: string;
    status: string;
    equipmentsCount: Number;
};

function UnitCard({ title, status, equipmentsCount }: UnitCardProps) {
    return (
        <div className="bg-light rounded-xl shadow-sm p-6 divide-y-2">
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
                <Typography>
                    Quantidade de Equipamentos:{" "}
                    <Typography element="span" className="font-semibold">
                        {String(equipmentsCount)}
                    </Typography>
                </Typography>
                <Button variant="secondary">Adicionar Equipamento</Button>
            </div>
        </div>
    );
}

export default UnitCard;
