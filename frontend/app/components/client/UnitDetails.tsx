import { useEffect, useState } from "react";

import {
    UnitDTO,
    UnitOperationDTO,
    useDeleteUnitOperationMutation,
} from "@/redux/features/unitApiSlice";

import { formatPhoneNumber } from "@/utils/format";
import { mask as cnpjMask } from "validation-br/dist/cnpj";

import { ArrowFatLineLeft } from "@phosphor-icons/react";

import { Button } from "@/components/common";
import { Typography } from "@/components/foundation";
import { OperationStatus, OperationType } from "@/enums";
import { isResponseError } from "@/redux/services/helpers";
import { toast } from "react-toastify";
import { useAppDispatch } from "@/redux/hooks";
import { Modals, openModal, setUnit, setUnitOperation, setUser } from "@/redux/features/modalSlice";
import { useStaff } from "@/hooks";
import { useRouter } from "next/navigation";

type UnitDetailsProps = {
    unit: UnitDTO;
    unitOperation: UnitOperationDTO | undefined;
};

enum ButtonsState {
    REVIEWSTAFF,
    REVIEWNONSTAFF,
    REJECTED,
    EDIT,
}

function UnitDetails({ unit, unitOperation }: UnitDetailsProps) {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { isStaff, userData } = useStaff();
    const isGGC = userData?.role === "GGC";
    const isGU = userData?.role === "GU";
    const [buttonsState, setButtonsState] = useState<ButtonsState>(ButtonsState.REVIEWNONSTAFF);
    const [loadingCancel, setLoadingCancel] = useState(false);

    const [deleteUnitOperation] = useDeleteUnitOperationMutation();

    async function handleCancel() {
        if (!unitOperation) {
            return;
        }

        setLoadingCancel(true);

        try {
            const response = await deleteUnitOperation(unitOperation.id);
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
                return toast.error("Algo deu errado. Tente novamente mais tarde.");
            }

            toast.success("Requisição cancelada com sucesso!");
        } catch (error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        } finally {
            setLoadingCancel(false);
        }
    }

    function handleEdit() {
        dispatch(setUnit(unit));
        dispatch(openModal(Modals.EDIT_UNIT));
    }

    function handleReject() {
        dispatch(openModal(Modals.REJECT_UNIT));
    }

    function handleDelete() {
        dispatch(setUnit(unit));
        dispatch(openModal(Modals.DELETE_UNIT));
    }

    function handleReview() {
        if (!unitOperation) {
            console.log("Couldn't handleReview in UnitDetails");
            return toast.error("Algo deu errado! Tente novamente mais tarde.");
        }
        dispatch(setUnitOperation(unitOperation));
        unitOperation.operation_type === OperationType.EDIT
            ? dispatch(openModal(Modals.REVIEW_EDIT_UNIT))
            : dispatch(openModal(Modals.REVIEW_DELETE_UNIT));
    }

    const handleAddUnitManager = () => {
        dispatch(setUnit(unit));
        dispatch(openModal(Modals.ADD_UNIT_MANAGER));
    };

    const handleDeleteUnitManager = () => {
        if (unit.user && typeof unit.user === "object") {
            dispatch(setUser(unit.user));
            dispatch(openModal(Modals.REMOVE_UNIT_MANAGER));
        }
    };

    // Set the buttons that should be rendered
    useEffect(() => {
        if (unitOperation?.operation_status === OperationStatus.REVIEW && !isStaff) {
            setButtonsState(ButtonsState.REVIEWNONSTAFF);
        } else if (unitOperation?.operation_status === OperationStatus.REVIEW && isStaff) {
            setButtonsState(ButtonsState.REVIEWSTAFF);
        } else if (unitOperation?.operation_status === OperationStatus.REJECTED && !isStaff) {
            setButtonsState(ButtonsState.REJECTED);
        } else {
            setButtonsState(ButtonsState.EDIT);
        }
    }, [unitOperation, isStaff]);

    return (
        <div className="flex flex-col gap-6 w-full md:w-2/5 rounded-lg p-6 md:p-8">
            <Button
                onClick={() => router.back()}
                variant="secondary"
                className="flex items-center gap-2"
                dataTestId="btn-go-back"
            >
                <ArrowFatLineLeft size={24} />
                <Typography size="md">Voltar</Typography>
            </Button>

            <div>
                <Typography
                    element="h2"
                    size="title2"
                    className="font-bold"
                    dataTestId="unit-header"
                >
                    Detalhes da Unidade
                </Typography>

                <Typography element="p" size="md" dataTestId="unit-details">
                    <b>Nome:</b> {unit.name}
                    <br />
                    <b>CNPJ:</b> {cnpjMask(unit.cnpj)}
                    <br />
                    <b>Telefone:</b> {formatPhoneNumber(unit.phone)}
                    <br />
                    <b>E-mail:</b> {unit.email}
                    <br />
                    <b>Endereço:</b> {`${unit.address}, ${unit.state} - ${unit.city}`}
                </Typography>

                <div className="flex flex-col gap-2 w-full mt-2">
                    {buttonsState === ButtonsState.REVIEWNONSTAFF && (
                        <>
                            <Typography variant="secondary">
                                {unitOperation?.operation_type === OperationType.EDIT
                                    ? "Requisição de alteração em análise"
                                    : "Requisição de remoção em análise"}
                            </Typography>
                            {(!isGU || unitOperation?.operation_type !== OperationType.DELETE) && (
                                <Button
                                    variant="danger"
                                    className="flex-grow"
                                    onClick={handleCancel}
                                    disabled={loadingCancel}
                                    data-testid="btn-cancel-unit-operation"
                                >
                                    Cancelar requisição
                                </Button>
                            )}
                        </>
                    )}

                    {buttonsState === ButtonsState.REVIEWSTAFF && (
                        <>
                            <Typography variant="secondary">
                                {unitOperation?.operation_type === OperationType.EDIT
                                    ? "Requisição de alteração em análise"
                                    : "Requisição de remoção em análise"}
                            </Typography>
                            <Button
                                variant="primary"
                                className="flex-grow"
                                onClick={handleReview}
                                disabled={loadingCancel}
                                data-testid="btn-review-unit-operation"
                            >
                                Revisar requisição
                            </Button>
                        </>
                    )}

                    {buttonsState === ButtonsState.REJECTED && (
                        <>
                            <Typography variant="danger">
                                {unitOperation?.operation_type === OperationType.EDIT
                                    ? "Requisição de alteração rejeitada"
                                    : "Requisição de remoção rejeitada"}
                            </Typography>
                            <Button
                                variant="danger"
                                className="flex-grow"
                                onClick={handleReject}
                                data-testid="btn-reject-unit-operation"
                            >
                                Verificar motivo
                            </Button>
                        </>
                    )}
                </div>

                {buttonsState === ButtonsState.EDIT && (
                    <div className="flex flex-row gap-2 w-full mt-2">
                        <Button
                            variant="secondary"
                            className="flex-grow"
                            onClick={handleEdit}
                            data-testid="btn-edit-unit"
                        >
                            Editar
                        </Button>
                        {userData?.role !== "GU" && (
                            <Button
                                variant="danger"
                                onClick={handleDelete}
                                className="flex-grow"
                                data-testid="btn-delete-unit"
                            >
                                Remover
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {userData?.role !== "GU" && (
                <div>
                    <Typography
                        element="h3"
                        size="title3"
                        className="font-bold"
                        dataTestId="unit-manager-header"
                    >
                        Gerente de Unidade
                    </Typography>

                    {unit.user && typeof unit.user === "object" ? (
                        <div className="flex flex-col gap-4">
                            <Typography element="p" size="md" dataTestId="unit-manager-user">
                                {unit.user.name}
                                <br />
                                {formatPhoneNumber(unit.user.phone)}
                                <br />
                                {unit.user.email}
                            </Typography>

                            {isGGC && (
                                <Button
                                    onClick={handleDeleteUnitManager}
                                    variant="danger"
                                    dataTestId="btn-delete-unit-manager"
                                >
                                    Remover gerente de unidade
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <Typography element="p" size="md" dataTestId="empty-unit-manager-user">
                                {isGGC
                                    ? "Nenhum gerente de unidade foi designado. Deseja atribuir um agora?"
                                    : "Nenhum gerente de unidade foi designado."}
                            </Typography>
                            {isGGC && (
                                <Button
                                    onClick={handleAddUnitManager}
                                    dataTestId="btn-add-unit-manager"
                                >
                                    Atribuir gerente de unidade
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default UnitDetails;
