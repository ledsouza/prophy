import { formatPhoneNumber } from "@/utils/format";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { mask as cnpjMask } from "validation-br/dist/cnpj";

import {
    useDeleteClientOperationMutation,
    useListAllClientsOperationsQuery,
} from "@/redux/features/clientApiSlice";
import { isResponseError } from "@/redux/services/helpers";
import type { ClientDTO, ClientOperationDTO } from "@/types/client";

import { Button, Spinner } from "@/components/common";
import { Select } from "@/components/forms";
import { SelectData } from "@/components/forms/Select";
import { Typography } from "@/components/foundation";

import { OperationStatus, OperationType } from "@/enums";
import Role from "@/enums/Role";
import { useStaff } from "@/hooks";
import { useListAllEquipmentsOperationsQuery } from "@/redux/features/equipmentApiSlice";
import { Modals, openModal } from "@/redux/features/modalSlice";
import {
    useListAllUnitsOperationsQuery,
    useListAllUnitsQuery,
} from "@/redux/features/unitApiSlice";
import { useAppDispatch } from "@/redux/hooks";
import { ArrowFatLineLeftIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import ClientContact from "./ClientContact";

type ClientDetailsProps = {
    title: string;
    isLoading: boolean;
    clientOptions: SelectData[];
    selectedClient: SelectData;
    setSelectedClient: (value: SelectData) => void;
    filteredClient: ClientDTO;
    selectedClientInOperation: ClientOperationDTO | null;
    hideClientSelector?: boolean;
};

function ClientDetails({
    title,
    isLoading,
    clientOptions,
    selectedClient,
    setSelectedClient,
    filteredClient,
    selectedClientInOperation,
    hideClientSelector = false,
}: ClientDetailsProps) {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { isStaff, userData } = useStaff();

    const [reviewOperationsIDs, setReviewOperationsIDs] = useState<Set<number>>(new Set());
    const [rejectedOperationsIDs, setRejectedOperationsIDs] = useState<Set<number>>(new Set());

    const { data: units, isLoading: isPaginatingUnits } = useListAllUnitsQuery();

    const { data: clientsOperations, isLoading: isLoadingClientsOperations } =
        useListAllClientsOperationsQuery();

    const { data: unitsOperations, isLoading: isLoadingUnitsOperations } =
        useListAllUnitsOperationsQuery();

    const { data: equipmentsOperations, isLoading: isLoadingEquipmentsOperations } =
        useListAllEquipmentsOperationsQuery();

    const [deleteClientOperation] = useDeleteClientOperationMutation();

    const [loadingCancel, setLoadingCancel] = useState(false);

    async function handleCancel() {
        if (!selectedClientInOperation) {
            return;
        }

        setLoadingCancel(true);

        try {
            const response = await deleteClientOperation(selectedClientInOperation.id);
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
    }

    function handleReject() {
        dispatch(openModal(Modals.REJECT_CLIENT));
    }

    function handleEdit() {
        dispatch(openModal(Modals.EDIT_CLIENT));
    }

    function handleReview() {
        dispatch(openModal(Modals.REVIEW_CLIENT));
    }

    const handleBack = () => {
        router.back();
    };

    // Obtaining the id of the clients that has a operation in progress
    useEffect(() => {
        if (
            isLoadingClientsOperations ||
            isLoadingUnitsOperations ||
            isLoadingEquipmentsOperations ||
            isPaginatingUnits
        ) {
            return;
        }

        const clientIDsFromClientOpsReview = (
            clientsOperations?.filter(
                (operation) => operation.operation_status === OperationStatus.REVIEW
            ) || []
        )
            .map((operation) => operation.original_client)
            .filter((id): id is number => id !== undefined);

        let clientIDsFromClientOpsRejected: number[];
        if (isStaff) {
            clientIDsFromClientOpsRejected = [];
        } else {
            clientIDsFromClientOpsRejected = (
                clientsOperations?.filter(
                    (operation) => operation.operation_status === OperationStatus.REJECTED
                ) || []
            )
                .map((operation) => operation.original_client)
                .filter((id): id is number => id !== undefined);
        }

        const clientIDsFromUnitOpsReview = (
            unitsOperations?.filter(
                (operation) => operation.operation_status === OperationStatus.REVIEW
            ) || []
        ).map((operation) => operation.client);

        let clientIDsFromUnitOpsRejected: number[];
        if (isStaff) {
            clientIDsFromUnitOpsRejected = [];
        } else {
            clientIDsFromUnitOpsRejected = (
                unitsOperations?.filter(
                    (operation) => operation.operation_status === OperationStatus.REJECTED
                ) || []
            ).map((operation) => operation.client);
        }

        const unitIDsFromEquipmentOpsReview = new Set(
            (
                equipmentsOperations?.filter(
                    (operation) => operation.operation_status === OperationStatus.REVIEW
                ) || []
            ).map((operation) => operation.unit)
        );

        let unitIDsFromEquipmentOpsRejected;
        if (isStaff) {
            unitIDsFromEquipmentOpsRejected = new Set(
                (
                    equipmentsOperations?.filter(
                        (operation) =>
                            operation.operation_status === OperationStatus.REJECTED &&
                            operation.operation_type !== OperationType.ADD
                    ) || []
                ).map((operation) => operation.unit)
            );
        } else {
            unitIDsFromEquipmentOpsRejected = new Set(
                (
                    equipmentsOperations?.filter(
                        (operation) => operation.operation_status === OperationStatus.REJECTED
                    ) || []
                ).map((operation) => operation.unit)
            );
        }

        const relevantUnitsReview = (units || []).filter((unit) =>
            unitIDsFromEquipmentOpsReview.has(unit.id)
        );

        const relevantUnitsRejected = (units || []).filter((unit) =>
            unitIDsFromEquipmentOpsRejected.has(unit.id)
        );

        const clientIDsFromUnitsReview = relevantUnitsReview.map((unit) => unit.client);
        const clientIDsFromUnitsRejected = relevantUnitsRejected.map((unit) => unit.client);

        const aggregatedClientIDsReview = [
            ...clientIDsFromClientOpsReview,
            ...clientIDsFromUnitOpsReview,
            ...clientIDsFromUnitsReview,
        ];

        const aggregatedClientIDsRejected = [
            ...clientIDsFromClientOpsRejected,
            ...clientIDsFromUnitOpsRejected,
            ...clientIDsFromUnitsRejected,
        ];

        setReviewOperationsIDs(new Set(aggregatedClientIDsReview));
        setRejectedOperationsIDs(new Set(aggregatedClientIDsRejected));
    }, [
        isLoadingClientsOperations,
        isLoadingUnitsOperations,
        isLoadingEquipmentsOperations,
        isPaginatingUnits,
        clientsOperations,
        unitsOperations,
        equipmentsOperations,
        isStaff,
        units,
    ]);

    if (isLoading) {
        return <Spinner md />;
    }

    const isUnitManager = userData?.role === Role.GU;

    return (
        <div className="flex flex-col gap-6 w-full md:w-2/5 rounded-lg p-6 md:p-8">
            {hideClientSelector && (
                <Button
                    variant="secondary"
                    onClick={handleBack}
                    className="flex items-center gap-2"
                    data-testid="btn-back-to-search"
                >
                    <ArrowFatLineLeftIcon size={24} />
                    Voltar à busca
                </Button>
            )}

            <Typography element="h2" size="title2" className="font-bold" dataTestId="client-header">
                {title}
            </Typography>

            <div>
                <Select
                    options={clientOptions}
                    selectedData={selectedClient}
                    setSelect={setSelectedClient}
                    operationsIDs={reviewOperationsIDs}
                    rejectedOperationIDs={rejectedOperationsIDs}
                    disabled={hideClientSelector}
                    listBoxStyles="mb-4"
                    listBoxButtonStyles="pl-2"
                    listBoxButtonSize="lg"
                    dataTestId="client-options"
                />
                <Typography element="p" size="md" dataTestId="client-details">
                    <b>CNPJ:</b> {cnpjMask(filteredClient?.cnpj)}
                    <br />
                    <b>Telefone:</b> {formatPhoneNumber(filteredClient?.phone)}
                    <br />
                    <b>E-mail:</b> {filteredClient?.email}
                    <br />
                    <b>Endereço:</b>{" "}
                    {`${filteredClient?.address}, ${filteredClient.city} - ${filteredClient.state}`}
                </Typography>

                {userData?.role !== Role.C && (
                    <div className="flex flex-col gap-2 w-full mt-2">
                        {selectedClientInOperation &&
                            selectedClientInOperation.operation_status ===
                                OperationStatus.REJECTED &&
                            !isStaff &&
                            !isUnitManager && (
                                <>
                                    <Typography variant="danger">
                                        Requisição de alteração rejeitada
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

                        {selectedClientInOperation &&
                            selectedClientInOperation.operation_status ===
                                OperationStatus.REJECTED &&
                            isStaff &&
                            !isUnitManager && (
                                <Button
                                    variant="secondary"
                                    className="flex-grow"
                                    onClick={handleEdit}
                                    data-testid="btn-edit-client"
                                >
                                    Editar
                                </Button>
                            )}

                        {selectedClientInOperation &&
                            selectedClientInOperation.operation_status === OperationStatus.REVIEW &&
                            !isUnitManager && (
                                <>
                                    <Typography variant="secondary">
                                        Requisição de alteração em análise
                                    </Typography>
                                    <Button
                                        variant={isStaff ? "primary" : "danger"}
                                        className="flex-grow"
                                        onClick={isStaff ? handleReview : handleCancel}
                                        disabled={loadingCancel}
                                        data-testid={
                                            isStaff
                                                ? "btn-review-edit-client"
                                                : "btn-cancel-edit-client"
                                        }
                                    >
                                        {isStaff ? "Revisar requisição" : "Cancelar requisição"}
                                    </Button>
                                </>
                            )}

                        {!selectedClientInOperation && !isUnitManager && (
                            <Button
                                variant="secondary"
                                className="flex-grow"
                                onClick={handleEdit}
                                data-testid="btn-edit-client"
                            >
                                Editar
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <ClientContact client={filteredClient} />

            {/* TODO */}
            {/* <div>
                <Typography
                    element="h3"
                    size="title3"
                    className="font-semibold"
                    dataTestId="invoice-header"
                >
                    Cobrança
                </Typography>

                <Typography element="p" size="md" dataTestId="invoice-nf">
                    Número NFe:{" "}
                    <Typography element="span" className="font-semibold">
                        Nº: 000027
                    </Typography>
                </Typography>
                <Typography element="p" size="md" dataTestId="invoice-emission">
                    Emissão:{" "}
                    <Typography element="span" className="font-semibold">
                        26 de Junho de 2024
                    </Typography>
                </Typography>
                <Typography element="p" size="md" dataTestId="invoice-due">
                    Vencimento:{" "}
                    <Typography element="span" className="font-semibold">
                        26 de Julho de 2024
                    </Typography>
                </Typography>
                <Button
                    variant="secondary"
                    className="mt-2"
                    data-testid="invoice-btn-details"
                >
                    Acessar detalhes
                </Button>
            </div> */}
        </div>
    );
}

export default ClientDetails;
