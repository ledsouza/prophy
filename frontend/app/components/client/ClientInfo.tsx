import React from "react";

import { Typography } from "@/components/foundation";
import { Button } from "@/components/common";
import { Select } from "@/components/forms";
import { SelectData } from "@/components/forms/Select";
import { ClientDTO } from "@/redux/features/clientApiSlice";

import { formatPhoneNumber } from "@/utils/format";

const getUserByRole = (client: ClientDTO, role: string) => {
    return client.users?.find((user) => user.role == role);
};

type ClientInfoProps = {
    clientOptions: SelectData[];
    selectedClient: SelectData;
    setSelectedClient: (value: SelectData) => void;
    filteredClient: ClientDTO;
};

function ClientInfo({
    clientOptions,
    selectedClient,
    setSelectedClient,
    filteredClient,
}: ClientInfoProps) {
    const gerenteProphy = getUserByRole(filteredClient, "Gerente Prophy");
    const fisicoMedicoInterno = getUserByRole(
        filteredClient,
        "Físico Médico Interno"
    );
    const fisicoMedicoExterno = getUserByRole(
        filteredClient,
        "Físico Médico Externo"
    );
    const comercial = getUserByRole(filteredClient, "Comercial");

    return (
        <div className="flex flex-col gap-6 w-full md:w-2/5 rounded-lg p-6 md:p-8">
            <Typography
                element="h2"
                size="title2"
                className="font-bold"
                dataTestId="client-header"
            >
                Detalhes do Cliente
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
                    {formatPhoneNumber(filteredClient?.phone)}
                    <br />
                    {filteredClient?.email}
                </Typography>
                <Typography
                    element="p"
                    size="md"
                    className="leading-2"
                    dataTestId="client-details-address"
                >
                    {filteredClient?.address}
                </Typography>
            </div>

            <div>
                <Typography
                    element="h3"
                    size="title3"
                    className="font-semibold"
                    dataTestId="prophy-header"
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
                    <Typography>
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
                    <Typography>
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

export default ClientInfo;
