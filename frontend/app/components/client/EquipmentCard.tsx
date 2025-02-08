import React, { useEffect, useState } from "react";
import cn from "classnames";

import { OperationStatus } from "@/enums";

import {
    EquipmentDTO,
    EquipmentOperationDTO,
    useDeleteEquipmentOperationMutation,
} from "@/redux/features/equipmentApiSlice";

import { Typography } from "@/components/foundation";
import { CardButtons, CardStatus } from "@/components/client";
import { useAppDispatch } from "@/redux/hooks";
import { Modals, openModal, setEquipment } from "@/redux/features/modalSlice";
import { toast } from "react-toastify";
import { isResponseError } from "@/redux/services/helpers";

type EquipmentCardProps = {
    equipment: EquipmentDTO;
    equipmentOperation: EquipmentOperationDTO | undefined;
    dataTestId?: string | undefined;
};

function EquipmentCard({
    equipment,
    equipmentOperation,
    dataTestId,
}: EquipmentCardProps) {
    const dispatch = useAppDispatch();

    const [status, setStatus] = useState<OperationStatus>();
    const [hasOperation, setHasOperation] = useState(false);
    const [isRejected, setIsRejected] = useState(false);

    const [deleteEquipmentOperation] = useDeleteEquipmentOperationMutation();

    const containerStyle = cn(
        "bg-light rounded-xl shadow-sm p-6 divide-y-2 hover:ring-1 focus:ring-inset hover:ring-primary",
        {
            "animate-warning": hasOperation,
            "animate-danger": isRejected,
        }
    );

    function handleEdit() {
        dispatch(setEquipment(equipment));
        dispatch(openModal(Modals.EDIT_EQUIPMENT));
    }

    function handleDelete() {
        dispatch(setEquipment(equipment));
        dispatch(openModal(Modals.DELETE_EQUIPMENT));
    }

    function handleReject() {
        dispatch(setEquipment(equipment));
        dispatch(openModal(Modals.REJECT_EQUIPMENT));
    }

    async function handleCancelEquipmentOperation() {
        if (!equipmentOperation) {
            return toast.error(
                "Algo deu errado! Não foi possível obter a requisição associada."
            );
        }

        try {
            const response = await deleteEquipmentOperation(
                equipmentOperation.id
            );
            if (isResponseError(response)) {
                if (response.error.status === 404) {
                    return toast.error(
                        `A requisição não foi encontrada. É possível que ela já tenha sido revisada por um físico médico.
                            Por favor, recarregue a página para atualizar a lista de requisições.`,
                        {
                            autoClose: 6000,
                        }
                    );
                }
            }

            toast.success("Requisição cancelada com sucesso!");
        } catch (error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }
    }

    function handleEquipmentDetails() {
        dispatch(setEquipment(equipment));
        dispatch(openModal(Modals.EQUIPMENT_DETAILS));
    }

    useEffect(() => {
        setStatus(
            equipmentOperation
                ? equipmentOperation.operation_status
                : OperationStatus.ACCEPTED
        );
    }, [equipmentOperation]);

    useEffect(() => {
        if (status === OperationStatus.REJECTED) {
            setHasOperation(false);
            setIsRejected(true);
        } else if (status === OperationStatus.REVIEW) {
            setHasOperation(true);
            setIsRejected(false);
        } else {
            setHasOperation(false);
            setIsRejected(false);
        }
    }, [status]);

    return (
        <div className={containerStyle} data-testid={dataTestId}>
            <div className="flex justify-between pb-4">
                <div className="flex flex-col">
                    <Typography element="h3" size="title3">
                        {equipment.model}
                    </Typography>
                    <Typography element="p" size="lg">
                        {equipment.manufacturer}
                    </Typography>
                    <Typography dataTestId="equipments-counts">
                        {equipment.modality}
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
                    operation={equipmentOperation}
                    status={status}
                    onDetails={handleEquipmentDetails}
                    onCancelEdit={handleCancelEquipmentOperation}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onReject={handleReject}
                    onReviewAdd={() => {}}
                    onReviewDelete={() => {}}
                    onReviewEdit={() => {}}
                />
            </div>
        </div>
    );
}

export default EquipmentCard;
