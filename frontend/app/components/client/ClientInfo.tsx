import React from "react";

import { Typography } from "@/components/foundation";
import { Button } from "@/components/common";
import { Select } from "@/components/forms";
import { SelectData } from "@/components/forms/Select";
import { ClientDTO } from "@/redux/features/clientApiSlice";

import { formatPhoneNumber } from "@/utils/format";

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
                {filteredClient?.users?.find(
                    (user) => user.role === "Gerente Prophy"
                ) ? (
                    <>
                        <Typography
                            element="p"
                            size="md"
                            dataTestId="prophy-responsible"
                        >
                            {
                                filteredClient?.users?.find(
                                    (user) => user.role === "Gerente Prophy"
                                )?.name
                            }
                        </Typography>
                        <Typography
                            element="p"
                            size="md"
                            dataTestId="prophy-phone"
                        >
                            (51) 98580 - 0080
                        </Typography>
                        <Typography
                            element="p"
                            size="md"
                            dataTestId="prophy-email"
                        >
                            contato@prophy.com
                        </Typography>
                    </>
                ) : (
                    <Typography>
                        Nomearemos um físico médico para esta instituição. Em
                        breve, divulgaremos os dados de contato do profissional
                        responsável.
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
