import { OperationStatus, OperationType } from "@/enums";
import Role from "@/enums/Role";

import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import { EquipmentDTO, EquipmentOperationDTO } from "@/redux/features/equipmentApiSlice";
import { UnitDTO, UnitOperationDTO } from "@/redux/features/unitApiSlice";

import { PencilLineIcon, TrashIcon } from "@phosphor-icons/react";

import { Button } from "@/components/common";
import { isUnit } from "@/utils/type-checks";

type CardButtonsProps = {
    entity: UnitDTO | EquipmentDTO;
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
    entity,
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
    const isStaff = userData?.role === Role.FMI || userData?.role === Role.GP;

    if (userData?.role === Role.C) {
        return (
            <>
                {operation?.operation_type !== OperationType.ADD && (
                    <Button variant="secondary" onClick={onDetails} data-testid="btn-details">
                        Acessar detalhes
                    </Button>
                )}
            </>
        );
    }

    return (
        <>
            {operation?.operation_type !== OperationType.ADD && (
                <Button variant="secondary" onClick={onDetails} data-testid="btn-details">
                    Acessar detalhes
                </Button>
            )}

            <div className="flex grow flex-col gap-2 sm:flex-row sm:justify-end">
                {status === OperationStatus.ACCEPTED && (
                    <>
                        <Button
                            variant="secondary"
                            onClick={onEdit}
                            data-testid="btn-edit-operation"
                        >
                            <PencilLineIcon size={20} />
                        </Button>
                        {(!isUnit(entity) || userData?.role !== Role.GU) && (
                            <Button
                                variant="danger"
                                onClick={onDelete}
                                data-testid="btn-delete-operation"
                            >
                                <TrashIcon size={20} />
                            </Button>
                        )}
                    </>
                )}

                {status === OperationStatus.REVIEW &&
                    operation?.operation_type === OperationType.ADD &&
                    !isStaff && (
                        <Button
                            variant="danger"
                            onClick={onCancelEdit}
                            className="w-full sm:w-auto"
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
                            className="w-full sm:w-auto"
                            data-testid="btn-review-operation"
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
                            className="w-full sm:w-auto"
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
                            className="w-full sm:w-auto"
                            data-testid="btn-review-operation"
                        >
                            Revisar requisição
                        </Button>
                    )}

                {status === OperationStatus.REVIEW &&
                    operation?.operation_type === OperationType.DELETE &&
                    !isStaff &&
                    (!isUnit(entity) || userData?.role !== Role.GU) && (
                        <Button
                            variant="danger"
                            onClick={onCancelEdit}
                            className="w-full sm:w-auto"
                            data-testid="btn-cancel-operation"
                        >
                            Cancelar remoção
                        </Button>
                    )}

                {status === OperationStatus.REVIEW &&
                    operation?.operation_type === OperationType.DELETE &&
                    isStaff && (
                        <Button
                            variant="primary"
                            onClick={onReviewDelete}
                            className="w-full sm:w-auto"
                            data-testid="btn-review-operation"
                        >
                            Revisar requisição
                        </Button>
                    )}

                {status === OperationStatus.REJECTED && !isStaff && (
                    <Button
                        variant="danger"
                        onClick={onReject}
                        className="w-full sm:w-auto"
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
                            <PencilLineIcon size={20} />
                        </Button>
                        <Button
                            variant="danger"
                            onClick={onDelete}
                            data-testid="btn-delete-operation"
                        >
                            <TrashIcon size={20} />
                        </Button>
                    </>
                )}
            </div>
        </>
    );
}

export default CardButtons;
