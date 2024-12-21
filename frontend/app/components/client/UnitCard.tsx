import React from "react";

import { PencilLine, Trash } from "@phosphor-icons/react";

import { Typography } from "@/components/foundation";
import { Button } from "@/components/common";
import { OperationStatus } from "@/enums";

type UnitCardProps = {
    title: string;
    status: string;
    equipmentsCount: number;
    onEdit: () => void;
    onCancelEdit: () => void;
    onDelete: () => void;
    onReject: () => void;
    handleDetails: () => void;
    dataTestId?: string | undefined;
};

function UnitCard({
    title,
    status,
    equipmentsCount,
    onEdit,
    onCancelEdit,
    onDelete,
    onReject,
    handleDetails,
    dataTestId,
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
                    <Typography element="h3" size="lg" className="text-right">
                        Status
                    </Typography>

                    {status === OperationStatus.ACCEPTED && (
                        <Typography className="text-success">
                            Aprovada
                        </Typography>
                    )}
                    {status === OperationStatus.REJECTED && (
                        <Typography className="text-danger">
                            Rejeitada
                        </Typography>
                    )}
                    {status === OperationStatus.REVIEW && (
                        <Typography className="text-primary">
                            Requisição em análise
                        </Typography>
                    )}
                </div>
            </div>
            <div className="flex gap-10 justify-between pt-4">
                <Button
                    variant="secondary"
                    onClick={handleDetails}
                    data-testid="btn-unit-detail"
                >
                    Acessar detalhes
                </Button>

                <div className="flex flex-row justify-between gap-2">
                    {status === OperationStatus.ACCEPTED && (
                        <>
                            <Button
                                variant="secondary"
                                onClick={onEdit}
                                data-testid="btn-edit-unit"
                            >
                                <PencilLine size={20} />
                            </Button>
                            <Button
                                variant="danger"
                                onClick={onDelete}
                                data-testid="btn-delete-unit"
                            >
                                <Trash size={20} />
                            </Button>
                        </>
                    )}

                    {status === OperationStatus.REVIEW && (
                        <Button
                            variant="danger"
                            onClick={onCancelEdit}
                            data-testid="btn-cancel-unit-operation"
                        >
                            Cancelar requisição
                        </Button>
                    )}

                    {status === OperationStatus.REJECTED && (
                        <Button
                            variant="danger"
                            onClick={onReject}
                            data-testid="btn-retry-unit-operation"
                        >
                            Verificar motivo
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UnitCard;
