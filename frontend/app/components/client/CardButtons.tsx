import { OperationStatus, OperationType } from "@/enums";

import { EquipmentOperationDTO } from "@/redux/features/equipmentApiSlice";
import { UnitOperationDTO } from "@/redux/features/unitApiSlice";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";

import { PencilLine, Trash } from "@phosphor-icons/react";

import { Button } from "@/components/common";

type CardButtonsProps = {
    operation: UnitOperationDTO | EquipmentOperationDTO | undefined;
    status: OperationStatus | undefined;
    onDetails: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onCancelEdit: () => void;
    onReject: () => void;
    onReviewAdd: () => void;
    onReviewEdit: () => void;
    onReviewDelete: () => void;
};

function CardButtons({
    operation,
    status,
    onDetails,
    onEdit,
    onDelete,
    onCancelEdit,
    onReject,
    onReviewAdd,
    onReviewDelete,
    onReviewEdit,
}: CardButtonsProps) {
    const { data: userData } = useRetrieveUserQuery();
    const isStaff = userData?.role === "FMI" || userData?.role === "GP";

    return (
        <>
            {operation?.operation_type !== OperationType.ADD && (
                <Button
                    variant="secondary"
                    onClick={onDetails}
                    data-testid="btn-details"
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
                            data-testid="btn-edit-operation"
                        >
                            <PencilLine size={20} />
                        </Button>
                        <Button
                            variant="danger"
                            onClick={onDelete}
                            data-testid="btn-delete-operation"
                        >
                            <Trash size={20} />
                        </Button>
                    </>
                )}

                {status === OperationStatus.REVIEW &&
                    operation?.operation_type === OperationType.ADD &&
                    !isStaff && (
                        <Button
                            variant="danger"
                            onClick={onCancelEdit}
                            className="w-40"
                            data-testid="btn-cancel-operation"
                        >
                            Cancelar adição
                        </Button>
                    )}

                {status === OperationStatus.REVIEW &&
                    operation?.operation_type === OperationType.ADD &&
                    isStaff && (
                        <Button
                            variant="primary"
                            onClick={onReviewAdd}
                            className="w-40"
                            data-testid="btn-cancel-operation"
                        >
                            Revisar requisição
                        </Button>
                    )}

                {status === OperationStatus.REVIEW &&
                    operation?.operation_type === OperationType.EDIT &&
                    !isStaff && (
                        <Button
                            variant="danger"
                            onClick={onCancelEdit}
                            className="w-40"
                            data-testid="btn-cancel-operation"
                        >
                            Cancelar alteração
                        </Button>
                    )}

                {status === OperationStatus.REVIEW &&
                    operation?.operation_type === OperationType.EDIT &&
                    isStaff && (
                        <Button
                            variant="primary"
                            onClick={onReviewEdit}
                            className="w-40"
                            data-testid="btn-cancel-operation"
                        >
                            Revisar requisição
                        </Button>
                    )}

                {status === OperationStatus.REVIEW &&
                    operation?.operation_type === OperationType.DELETE &&
                    !isStaff && (
                        <Button
                            variant="danger"
                            onClick={onCancelEdit}
                            className="w-40"
                            data-testid="btn-cancel-operation"
                        >
                            Cancelar remoção
                        </Button>
                    )}

                {status === OperationStatus.REVIEW &&
                    operation?.operation_type === OperationType.DELETE &&
                    isStaff && (
                        <Button
                            variant="danger"
                            onClick={onReviewDelete}
                            className="w-40"
                            data-testid="btn-cancel-operation"
                        >
                            Revisar requisição
                        </Button>
                    )}

                {status === OperationStatus.REJECTED && !isStaff && (
                    <Button
                        variant="danger"
                        onClick={onReject}
                        className="w-40"
                        data-testid="btn-reject-operation"
                    >
                        Verificar motivo
                    </Button>
                )}

                {status === OperationStatus.REJECTED && isStaff && (
                    <>
                        <Button
                            variant="secondary"
                            onClick={onEdit}
                            data-testid="btn-edit-operation"
                        >
                            <PencilLine size={20} />
                        </Button>
                        <Button
                            variant="danger"
                            onClick={onDelete}
                            data-testid="btn-delete-operation"
                        >
                            <Trash size={20} />
                        </Button>
                    </>
                )}
            </div>
        </>
    );
}

export default CardButtons;
