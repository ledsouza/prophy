import { OperationStatus, OperationType } from "@/enums";
import { EquipmentOperationDTO } from "@/redux/features/equipmentApiSlice";
import { UnitOperationDTO } from "@/redux/features/unitApiSlice";

import { Button } from "@/components/common";
import { PencilLine, Trash } from "@phosphor-icons/react";

type CardButtonsProps = {
    operation: UnitOperationDTO | EquipmentOperationDTO | undefined;
    status: OperationStatus | undefined;
    onDetails: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onCancelEdit: () => void;
    onReject: () => void;
};

function CardButtons({
    operation,
    status,
    onDetails,
    onEdit,
    onDelete,
    onCancelEdit,
    onReject,
}: CardButtonsProps) {
    return (
        <>
            {operation?.operation_type !== OperationType.ADD && (
                <Button
                    variant="secondary"
                    onClick={onDetails}
                    data-testid="btn-unit-detail"
                >
                    Acessar detalhes
                </Button>
            )}

            <div className="flex flex-grow justify-end gap-2">
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

                {status === OperationStatus.REVIEW &&
                    operation?.operation_type === OperationType.ADD && (
                        <Button
                            variant="danger"
                            onClick={onCancelEdit}
                            className="w-40"
                            data-testid="btn-cancel-unit-operation"
                        >
                            Cancelar adição
                        </Button>
                    )}

                {status === OperationStatus.REVIEW &&
                    operation?.operation_type === OperationType.EDIT && (
                        <Button
                            variant="danger"
                            onClick={onCancelEdit}
                            className="w-40"
                            data-testid="btn-cancel-unit-operation"
                        >
                            Cancelar alteração
                        </Button>
                    )}

                {status === OperationStatus.REVIEW &&
                    operation?.operation_type === OperationType.DELETE && (
                        <Button
                            variant="danger"
                            onClick={onCancelEdit}
                            className="w-40"
                            data-testid="btn-cancel-unit-operation"
                        >
                            Cancelar remoção
                        </Button>
                    )}

                {status === OperationStatus.REJECTED && (
                    <Button
                        variant="danger"
                        onClick={onReject}
                        className="w-40"
                        data-testid="btn-retry-unit-operation"
                    >
                        Verificar motivo
                    </Button>
                )}
            </div>
        </>
    );
}

export default CardButtons;
