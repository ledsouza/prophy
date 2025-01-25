import React, { useState } from "react";
import { formatPhoneNumber } from "@/utils/format";
import { mask as cnpjMask } from "validation-br/dist/cnpj";
import { toast } from "react-toastify";

import { isResponseError } from "@/redux/services/helpers";
import {
    ClientDTO,
    ClientOperationDTO,
    useDeleteClientOperationMutation,
} from "@/redux/features/clientApiSlice";

import { Typography } from "@/components/foundation";
import { Button } from "@/components/common";
import { Select } from "@/components/forms";
import { SelectData } from "@/components/forms/Select";

import { OperationStatus } from "@/enums";
import ClientContact from "./ClientContact";

type ClientDetailsProps = {
    title: string;
    isLoading: boolean;
    clientOptions: SelectData[];
    selectedClient: SelectData;
    setSelectedClient: (value: SelectData) => void;
    filteredClient: ClientDTO;
    selectedClientInOperation: ClientOperationDTO | null;
    handleEdit: () => void;
    handleReject: () => void;
};

function ClientDetails({
    title,
    isLoading,
    clientOptions,
    selectedClient,
    setSelectedClient,
    filteredClient,
    selectedClientInOperation,
    handleEdit,
    handleReject,
}: ClientDetailsProps) {
    const [deleteClientOperation] = useDeleteClientOperationMutation();

    const [loadingCancel, setLoadingCancel] = useState(false);

    const handleCancel = async () => {
        if (!selectedClientInOperation) {
            return;
        }

        setLoadingCancel(true);

        try {
            const response = await deleteClientOperation(
                selectedClientInOperation.id
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
        } finally {
            setLoadingCancel(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full md:w-2/5 rounded-lg p-6 md:p-8">
            <Typography
                element="h2"
                size="title2"
                className="font-bold"
                dataTestId="client-header"
            >
                {title}
            </Typography>

            <div>
                <Select
                    options={clientOptions}
                    selectedData={selectedClient}
                    setSelect={setSelectedClient}
                    listBoxStyles="mb-4"
                    dataTestId="client-options"
                />
                <Typography element="p" size="md" dataTestId="client-details">
                    <b>CNPJ:</b> {cnpjMask(filteredClient?.cnpj)}
                    <br />
                    <b>Telefone:</b> {formatPhoneNumber(filteredClient?.phone)}
                    <br />
                    <b>E-mail:</b> {filteredClient?.email}
                    <br />
                    <b>Endereço:</b> {filteredClient?.address}
                </Typography>
                <div className="flex flex-col gap-2 w-full mt-2">
                    {selectedClientInOperation &&
                        selectedClientInOperation.operation_status ===
                            OperationStatus.REJECTED && (
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
                            OperationStatus.REVIEW && (
                            <>
                                <Typography variant="secondary">
                                    Requisição de alteração em análise
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

                    {!selectedClientInOperation && (
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
