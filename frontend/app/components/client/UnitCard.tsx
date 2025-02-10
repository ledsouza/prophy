import React, { useEffect, useState } from "react";
import cn from "classnames";

import { useRouter } from "next/navigation";

import { OperationStatus, OperationType } from "@/enums";

import {
    UnitDTO,
    UnitOperationDTO,
    useDeleteUnitOperationMutation,
} from "@/redux/features/unitApiSlice";

import { CardButtons, CardStatus } from "@/components/client";
import { Typography } from "@/components/foundation";
import { useListAllEquipmentsOperationsQuery } from "@/redux/features/equipmentApiSlice";
import { useAppDispatch } from "@/redux/hooks";
import {
    Modals,
    openModal,
    setUnit,
    setUnitOperation,
} from "@/redux/features/modalSlice";
import { isResponseError } from "@/redux/services/helpers";
import { toast } from "react-toastify";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";

type UnitCardProps = {
    unit: UnitDTO;
    unitOperation: UnitOperationDTO | undefined;
    equipmentsCount: number;
    dataTestId?: string | undefined;
};

function UnitCard({
    unit,
    unitOperation,
    equipmentsCount,
    dataTestId,
}: UnitCardProps) {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { data: userData } = useRetrieveUserQuery();
    const isStaff = userData?.role === "FMI" || userData?.role === "GP";

    const { data: equipmentOperations } = useListAllEquipmentsOperationsQuery();
    const [deleteUnitOperation] = useDeleteUnitOperationMutation();

    const [status, setStatus] = useState<OperationStatus>();
    const [hasOperation, setHasOperation] = useState(false);
    const [isRejected, setIsRejected] = useState(false);

    const containerStyle = cn(
        "bg-light rounded-xl shadow-sm p-6 divide-y-2 hover:ring-1 focus:ring-inset hover:ring-primary",
        {
            "animate-warning": hasOperation,
            "animate-danger": isRejected,
        }
    );

    function handleEdit() {
        dispatch(setUnit(unit));
        dispatch(openModal(Modals.EDIT_UNIT));
    }

    function handleDelete() {
        dispatch(setUnit(unit));
        dispatch(openModal(Modals.DELETE_UNIT));
    }

    async function handleCancelEdit() {
        if (!unitOperation) {
            return toast.error(
                "Requisição não encontrada. Atualize a página e tente novamente."
            );
        }

        try {
            const response = await deleteUnitOperation(unitOperation.id);
            if (isResponseError(response)) {
                if (response.error.status === 404) {
                    return toast.error(
                        `A requisição não foi encontrada.
                        Por favor, recarregue a página para atualizar a lista de requisições.`,
                        {
                            autoClose: 5000,
                        }
                    );
                }
                return toast.error(
                    "Algo deu errado. Tente novamente mais tarde."
                );
            }

            toast.success("Requisição cancelada com sucesso!");
        } catch (error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }
    }

    function handleReject() {
        dispatch(setUnit(unit));
        dispatch(openModal(Modals.REJECT_UNIT));
    }

    function handleReviewEdit() {
        if (unitOperation) {
            dispatch(setUnit(unit));
            dispatch(setUnitOperation(unitOperation));
            dispatch(openModal(Modals.REVIEW_EDIT_UNIT));
        } else {
            toast.error("Algo deu errado! Tente novamente mais tarde.");
        }
    }

    function handleReviewAdd() {
        if (unitOperation) {
            dispatch(setUnitOperation(unitOperation));
            dispatch(openModal(Modals.REVIEW_ADD_UNIT));
        } else {
            toast.error("Algo deu errado! Tente novamente mais tarde.");
        }
    }

    function handleReviewDelete() {
        if (unitOperation) {
            dispatch(setUnitOperation(unitOperation));
            dispatch(openModal(Modals.REVIEW_DELETE_UNIT));
            return;
        }
        toast.error("Algo deu errado! Tente novamente mais tarde.");
    }

    useEffect(() => {
        if (
            isStaff &&
            unitOperation?.operation_status === OperationStatus.REJECTED
        ) {
            setStatus(OperationStatus.ACCEPTED);
            return;
        }
        setStatus(
            unitOperation
                ? unitOperation.operation_status
                : OperationStatus.ACCEPTED
        );
    }, [unitOperation]);

    useEffect(() => {
        const unitIDsFromEquipmentOpsReview = equipmentOperations
            ?.filter(
                (operation) =>
                    operation.operation_status === OperationStatus.REVIEW
            )
            ?.map((operation) => operation.unit);

        const unitIDsFromEquipmentOpsRejected = equipmentOperations
            ?.filter(
                (operation) =>
                    operation.operation_status === OperationStatus.REJECTED
            )
            ?.map((operation) => operation.unit);

        if (
            status === OperationStatus.REJECTED ||
            unitIDsFromEquipmentOpsRejected?.includes(unit.id)
        ) {
            setHasOperation(false);
            setIsRejected(true);
        } else if (
            status === OperationStatus.REVIEW ||
            unitIDsFromEquipmentOpsReview?.includes(unit.id)
        ) {
            setHasOperation(true);
            setIsRejected(false);
        } else {
            setHasOperation(false);
            setIsRejected(false);
        }
    }, [status, equipmentOperations]);

    if (
        isStaff &&
        unitOperation?.operation_status === OperationStatus.REJECTED &&
        unitOperation.operation_type === OperationType.ADD
    ) {
        return;
    }

    return (
        <div className={containerStyle} data-testid={dataTestId}>
            <div className="flex justify-between pb-4">
                <div className="flex flex-col">
                    <Typography
                        element="h3"
                        size="title3"
                        dataTestId="unit-name"
                    >
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
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onCancelEdit={handleCancelEdit}
                    onReject={handleReject}
                    onReviewAdd={handleReviewAdd}
                    onReviewEdit={handleReviewEdit}
                    onReviewDelete={handleReviewDelete}
                />
            </div>
        </div>
    );
}

export default UnitCard;
