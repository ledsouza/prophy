import { useState } from "react";

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

type UnitDetailsProps = {
    unit: UnitDTO;
    unitOperation: UnitOperationDTO | undefined;
    handleEdit: () => void;
    handleDelete: () => void;
    handleReject: () => void;
};

function UnitDetails({
    unit,
    unitOperation,
    handleEdit,
    handleDelete,
    handleReject,
}: UnitDetailsProps) {
    const [loadingCancel, setLoadingCancel] = useState(false);

    const [deleteUnitOperation] = useDeleteUnitOperationMutation();

    const handleCancel = async () => {
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
            }

            toast.success("Requisição cancelada com sucesso!");
        } catch (error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        } finally {
            setLoadingCancel(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full md:w-2/5 rounded-lg p-6 md:p-8">
            <Button
                href="/dashboard"
                variant="secondary"
                dataTestId="btn-go-back"
            >
                <div className="flex flex-row gap-2 justify-center align-middle text-center">
                    <ArrowFatLineLeft size="1.8em" />
                    <Typography size="md">Voltar</Typography>
                </div>
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
                    <b>Endereço:</b> {unit.address}
                </Typography>

                <div className="flex flex-col gap-2 w-full mt-2">
                    {unitOperation &&
                        unitOperation.operation_status ===
                            OperationStatus.REVIEW && (
                            <>
                                <Typography variant="secondary">
                                    {unitOperation.operation_type ===
                                    OperationType.EDIT
                                        ? "Requisição de alteração em análise"
                                        : "Requisição de remoção em análise"}
                                </Typography>
                                <Button
                                    variant="danger"
                                    className="flex-grow"
                                    onClick={handleCancel}
                                    disabled={loadingCancel}
                                    data-testid="btn-cancel-edit-client"
                                >
                                    Cancelar requisição
                                </Button>
                            </>
                        )}

                    {unitOperation &&
                        unitOperation.operation_status ===
                            OperationStatus.REJECTED && (
                            <>
                                <Typography variant="danger">
                                    {unitOperation.operation_type ===
                                    OperationType.EDIT
                                        ? "Requisição de alteração rejeitada"
                                        : "Requisição de remocão rejeitada"}
                                </Typography>
                                <Button
                                    variant="danger"
                                    className="flex-grow"
                                    onClick={handleReject}
                                    data-testid="btn-reject-edit-client"
                                >
                                    Verificar motivo
                                </Button>
                            </>
                        )}
                </div>

                {!unitOperation && (
                    <div className="flex flex-row gap-2 w-full mt-2">
                        <Button
                            variant="secondary"
                            className="flex-grow"
                            onClick={handleEdit}
                            data-testid="btn-edit-unit"
                        >
                            Editar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            className="flex-grow"
                            data-testid="btn-delete-unit"
                        >
                            Remover
                        </Button>
                    </div>
                )}
            </div>

            <div>
                <Typography
                    element="h3"
                    size="title3"
                    className="font-bold"
                    dataTestId="unit-manager-header"
                >
                    Gerente de Unidade
                </Typography>

                {unit.user ? (
                    <Typography
                        element="p"
                        size="md"
                        dataTestId="unit-manager-user"
                    >
                        {unit.user.name}
                        <br />
                        {formatPhoneNumber(unit.user.phone)}
                        <br />
                        {unit.user.email}
                    </Typography>
                ) : (
                    <div className="flex flex-col gap-2">
                        <Typography
                            element="p"
                            size="md"
                            dataTestId="empty-unit-manager-user"
                        >
                            Nenhum gerente de unidade foi designado. Deseja
                            atribuir um agora?
                        </Typography>
                        <Button dataTestId="btn-add-unit-manager">
                            Atribuir gerente de unidade
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UnitDetails;
