import React, { useEffect, useState } from "react";

import { formatPhoneNumber } from "@/utils/format";
import { mask as cnpjMask } from "validation-br/dist/cnpj";
import { toast } from "react-toastify";

import {
    ClientDTO,
    ClientOperationDTO,
    useDeleteClientOperationMutation,
    useListClientsOperationsQuery,
} from "@/redux/features/clientApiSlice";

import { Typography } from "@/components/foundation";
import { Button } from "@/components/common";
import { Select } from "@/components/forms";
import { SelectData } from "@/components/forms/Select";

import useGetAll from "@/hooks/use-get-all";

const getUserByRole = (client: ClientDTO, role: string) => {
    return client.users?.find((user) => user.role == role);
};

type ClientDetailsProps = {
    clientOptions: SelectData[];
    selectedClient: SelectData;
    setSelectedClient: (value: SelectData) => void;
    filteredClient: ClientDTO;
    handleEdit: () => void;
};

function ClientDetails({
    clientOptions,
    selectedClient,
    setSelectedClient,
    filteredClient,
    handleEdit,
}: ClientDetailsProps) {
    const gerenteProphy = getUserByRole(filteredClient, "GP");
    const fisicoMedicoInterno = getUserByRole(filteredClient, "FMI");
    const fisicoMedicoExterno = getUserByRole(filteredClient, "FME");
    const comercial = getUserByRole(filteredClient, "C");

    const [selectedClientInOperation, setSelectedClientInOperation] =
        useState<ClientOperationDTO | null>(null);

    const {
        items: clientsOperations,
        isLoading: isLoadingClientsOperations,
        error,
    } = useGetAll(useListClientsOperationsQuery);

    const [deleteClientOperation] = useDeleteClientOperationMutation();

    const handleCancel = async () => {
        if (!selectedClientInOperation) {
            return;
        }

        try {
            const response = await deleteClientOperation(
                selectedClientInOperation.id
            );
            if (response.error) {
                return toast.error(
                    "Algo deu errado. Tente novamente mais tarde."
                );
            }
            toast.success("Requisição cancelada com sucesso!");
        } catch (error) {
            toast.error("Algo deu errado. Tente novamente mais tarde.");
        }
    };

    // Check if the selected client has an operation in progress
    useEffect(() => {
        if (!isLoadingClientsOperations) {
            const operation = clientsOperations.find(
                (operation) => operation.original_client === selectedClient.id
            );
            operation
                ? setSelectedClientInOperation(operation)
                : setSelectedClientInOperation(null);
        }
    }, [isLoadingClientsOperations, selectedClient]);

    return (
        <div className="flex flex-col gap-6 w-full md:w-2/5 rounded-lg p-6 md:p-8">
            <Typography
                element="h2"
                size="title2"
                className="font-bold"
                dataTestId="client-header"
            >
                Detalhes da instituição
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
                    {selectedClientInOperation ? (
                        <>
                            <Typography variant="secondary">
                                Requisição de alteração em análise
                            </Typography>
                            <Button
                                variant="danger"
                                className="flex-grow"
                                onClick={handleCancel}
                                data-testid="btn-cancel-edit-client"
                            >
                                Cancelar requisição
                            </Button>
                        </>
                    ) : (
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

            <div>
                <Typography
                    element="h3"
                    size="title3"
                    className="font-semibold"
                    dataTestId="responsable-medical-physicist-header"
                >
                    Físico Médico Responsável
                </Typography>

                {gerenteProphy || fisicoMedicoInterno || fisicoMedicoExterno ? (
                    <div className="flex flex-col gap-3">
                        {gerenteProphy && (
                            <div data-testid="gerente-prophy">
                                <Typography element="p" size="md">
                                    {gerenteProphy.name}
                                    <br />
                                    {formatPhoneNumber(gerenteProphy.phone)}
                                    <br />
                                    {gerenteProphy.email}
                                </Typography>
                            </div>
                        )}

                        {fisicoMedicoInterno && (
                            <div data-testid="fisico-medico-interno">
                                <Typography element="p" size="md">
                                    {fisicoMedicoInterno.name}
                                    <br />
                                    {formatPhoneNumber(
                                        fisicoMedicoInterno.phone
                                    )}
                                    <br />
                                    {fisicoMedicoInterno.email}
                                </Typography>
                            </div>
                        )}

                        {fisicoMedicoExterno && (
                            <div data-testid="fisico-medico-externo">
                                <Typography element="p" size="md">
                                    {fisicoMedicoExterno.name}
                                    <br />
                                    {formatPhoneNumber(
                                        fisicoMedicoExterno.phone
                                    )}
                                    <br />
                                    {fisicoMedicoExterno.email}
                                </Typography>
                            </div>
                        )}
                    </div>
                ) : (
                    <Typography dataTestId="empty-responsable-medical-physicist">
                        Designaremos um físico médico para esta instituição e,
                        em breve, disponibilizaremos os dados de contato do
                        profissional responsável.
                    </Typography>
                )}
            </div>

            <div data-testid="comercial-details">
                <Typography
                    element="h3"
                    size="title3"
                    className="font-semibold"
                    dataTestId="comercial-header"
                >
                    Gerente Comercial
                </Typography>

                {comercial || gerenteProphy ? (
                    <Typography>
                        {comercial?.name || gerenteProphy?.name}
                        <br />
                        {formatPhoneNumber(comercial?.phone) ||
                            formatPhoneNumber(gerenteProphy?.phone)}
                        <br />
                        {comercial?.email || gerenteProphy?.email}
                    </Typography>
                ) : (
                    <Typography dataTestId="empty-comercial">
                        Designaremos um gerente comercial para esta instituição
                        e, em breve, disponibilizaremos os dados de contato do
                        profissional responsável.
                    </Typography>
                )}
            </div>

            <div>
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
            </div>
        </div>
    );
}

export default ClientDetails;
