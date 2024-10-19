import React from "react";

import { Typography } from "@/components/foundation";
import { Button } from "@/components/common";
import { Select } from "@/components/forms";
import { SelectData } from "@/components/forms/Select";
import { Cliente } from "@/redux/features/clienteApiSlice";

type ClientInfoProps = {
    clientOptions: SelectData[];
    selectedClient: SelectData;
    setSelectedClient: (value: SelectData) => void;
    filteredClient: Cliente;
};

function formatPhoneNumber(phone?: string): string | undefined {
    if (!phone) return undefined;

    if (phone.length === 11) {
        return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
    } else if (phone.length === 10) {
        return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
    } else {
        return "Número de telefone inválido";
    }
}

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
                />
                <Typography element="p" size="md">
                    {formatPhoneNumber(filteredClient?.telefone_instituicao!)}
                    <br />
                    {filteredClient?.email_instituicao}
                </Typography>
                <Typography element="p" size="md" className="leading-2">
                    {filteredClient?.endereco_instituicao}
                </Typography>
            </div>

            <div>
                <Typography
                    element="h3"
                    size="title3"
                    className="font-semibold"
                >
                    Físico Médico Responsável
                </Typography>
                <Typography element="p" size="md">
                    {filteredClient?.users?.find(
                        (user) => user.role === "Gerente Prophy"
                    )?.name || "N/A"}
                </Typography>
                <Typography element="p" size="md">
                    (51) 98580 - 0080
                </Typography>
                <Typography element="p" size="md">
                    contato@prophy.com
                </Typography>
            </div>

            <div>
                <Typography
                    element="h3"
                    size="title3"
                    className="font-semibold"
                >
                    Cobrança
                </Typography>
                <Typography element="p" size="md">
                    Número NFe:{" "}
                    <Typography element="span" className="font-semibold">
                        Nº: 000027
                    </Typography>
                </Typography>
                <Typography element="p" size="md">
                    Emissão:{" "}
                    <Typography element="span" className="font-semibold">
                        26 de Junho de 2024
                    </Typography>
                </Typography>
                <Typography element="p" size="md">
                    Vencimento:{" "}
                    <Typography element="span" className="font-semibold">
                        26 de Julho de 2024
                    </Typography>
                </Typography>
                <Button variant="secondary" className="mt-2">
                    Acessar detalhes
                </Button>
            </div>
        </div>
    );
}

export default ClientInfo;
