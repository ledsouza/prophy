import React from "react";
import { Cliente } from "@/redux/features/clienteApiSlice";

import { Typography } from "@/components/foundation";
import { Button } from "@/components/common";

type ClientInfoProps = {
    clientData: Cliente;
};

function formatPhoneNumber(phone: string): string {
    if (phone.length == 11) {
        return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)} - ${phone.slice(
            7
        )}`;
    }
    if (phone.length == 10) {
        return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)} - ${phone.slice(
            6
        )}`;
    }
    throw new Error("Invalid phone number length");
}

function ClientInfo({ clientData }: ClientInfoProps) {
    return (
        <div className="flex gap-6 flex-col w-2/5">
            <Typography element="h2" size="title2" className="font-bold">
                Detalhes do Cliente
            </Typography>

            <div>
                <Typography
                    element="h3"
                    size="title3"
                    className="font-semibold"
                >
                    {clientData?.nome_instituicao}
                </Typography>
                <Typography element="p" size="md">
                    {formatPhoneNumber(clientData?.telefone_instituicao!)}
                    <br />
                    {clientData?.email_instituicao}
                    <br />
                    {clientData?.endereco_instituicao}
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
                    {
                        clientData?.users?.find(
                            (user) => user.role === "Gerente Prophy"
                        )?.name
                    }
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
