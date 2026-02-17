import cn from "classnames";
import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { OperationStatus } from "@/enums";
import Role from "@/enums/Role";

import {
    UnitDTO,
    UnitOperationDTO,
    useDeleteUnitOperationMutation,
} from "@/redux/features/unitApiSlice";

import { CardButtons, CardStatus } from "@/components/client";
import { Typography } from "@/components/foundation";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import { useListAllEquipmentsOperationsQuery } from "@/redux/features/equipmentApiSlice";
import { Modals, openModal, setUnit, setUnitOperation } from "@/redux/features/modalSlice";
import { useAppDispatch } from "@/redux/hooks";
import { isResponseError } from "@/redux/services/helpers";
import { shouldHideRejectedAddOperation } from "@/utils/operations";
import { toast } from "react-toastify";

type UnitCardProps = {
    unit: UnitDTO;
    unitOperation: UnitOperationDTO | undefined;
    equipmentsCount: number;
    dataTestId?: string | undefined;
};

function UnitCard({ unit, unitOperation, equipmentsCount, dataTestId }: UnitCardProps) {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { data: userData } = useRetrieveUserQuery();
    const isStaff = userData?.role === Role.FMI || userData?.role === Role.GP;

    const { data: equipmentOperations } = useListAllEquipmentsOperationsQuery();
    const [deleteUnitOperation] = useDeleteUnitOperationMutation();

    const [status, setStatus] = useState<OperationStatus>();
    const [hasOperation, setHasOperation] = useState(false);
    const [isRejected, setIsRejected] = useState(false);

    const containerStyle = cn(
        "bg-light rounded-xl shadow-sm p-4 sm:p-6 divide-y divide-gray-200 hover:ring-1 hover:ring-inset focus:ring-inset hover:ring-primary",
        {
            "animate-warning": hasOperation,
            "animate-danger": isRejected && !isStaff,
        },
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
            return toast.error("Requisição não encontrada. Atualize a página e tente novamente.");
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
                        },
                    );
                }
                return toast.error("Algo deu errado. Tente novamente mais tarde.");
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
        if (isStaff && unitOperation?.operation_status === OperationStatus.REJECTED) {
            setStatus(OperationStatus.ACCEPTED);
            return;
        }
        setStatus(unitOperation ? unitOperation.operation_status : OperationStatus.ACCEPTED);
    }, [unitOperation, isStaff]);

    useEffect(() => {
        const unitIDsFromEquipmentOpsReview = equipmentOperations
            ?.filter((operation) => operation.operation_status === OperationStatus.REVIEW)
            ?.map((operation) => operation.unit);

        const unitIDsFromEquipmentOpsRejected = equipmentOperations
            ?.filter((operation) => operation.operation_status === OperationStatus.REJECTED)
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
    }, [status, equipmentOperations, unit.id]);

    if (shouldHideRejectedAddOperation(isStaff, unitOperation)) {
        return;
    }

    return (
        <div className={containerStyle} data-testid={dataTestId}>
            <div className="flex flex-col gap-4 pb-4 sm:flex-row sm:justify-between sm:gap-10">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <Typography element="h3" size="title3" dataTestId="unit-name">
                            {unit.name}
                        </Typography>
                        <Typography element="p" size="sm" variant="secondary">
                            {unit.address}
                        </Typography>
                        <Typography element="p" size="sm" variant="secondary">
                            {unit.state} - {unit.city}
                        </Typography>
                    </div>

                    <div className="flex flex-col gap-1">
                        <Typography element="p" size="sm" variant="secondary">
                            Quantidade de equipamentos
                        </Typography>
                        <Typography element="p" size="lg" className="font-semibold">
                            {String(equipmentsCount)}
                        </Typography>
                    </div>
                </div>

                <div className="flex flex-col gap-2 sm:items-end">
                    <Typography element="h3" size="lg" className="sm:text-right">
                        Situação
                    </Typography>

                    <CardStatus status={status} />
                </div>
            </div>

            <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <CardButtons
                    entity={unit}
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
