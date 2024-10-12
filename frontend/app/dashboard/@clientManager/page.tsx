"use client";

import React from "react";

import { useListClientsQuery as getClients } from "@/redux/features/clienteApiSlice";
import { useListUnitsQuery as getUnits } from "@/redux/features/unidadeApiSlice";

import { Typography } from "@/components/foundation";
import { Button, Spinner, UnitCard } from "@/components/common";

function ClientPage() {
    const { data: paginatedClientsData, isLoading: isLoadingClients } =
        getClients({});
    const clientData = paginatedClientsData?.results[0];

    const { data: paginatedUnitsData } = getUnits({});
    const unitsData = paginatedUnitsData?.results;

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

    return (
        <main className="flex gap-6">
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
                        Responsável Prophy
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

                {!isLoadingClients ? (
                    <div>
                        <Typography
                            element="h3"
                            size="title3"
                            className="font-semibold"
                        >
                            {clientData?.nome_instituicao}
                        </Typography>
                        <Typography element="p" size="md">
                            {formatPhoneNumber(
                                clientData?.telefone_instituicao!
                            )}
                        </Typography>
                        <Typography element="p" size="md">
                            {clientData?.email_instituicao}
                        </Typography>
                        <Typography element="p" size="md">
                            {clientData?.endereco_instituicao}
                        </Typography>
                    </div>
                ) : (
                    <div className="flex justify-center align-middle">
                        <Spinner md />
                    </div>
                )}

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

            <div className="w-full flex flex-col gap-6 bg-white rounded-xl shadow-lg p-8">
                <Typography
                    element="h2"
                    size="title2"
                    className="mb-6 font-bold"
                >
                    Unidades
                </Typography>

                <div className="flex flex-col gap-6">
                    {unitsData?.map((unit) => (
                        <UnitCard
                            key={unit.id}
                            title={unit.nome}
                            status="Aceito"
                            equipmentsCount={2}
                        />
                    ))}
                </div>

                <Button>Adicionar Unidade</Button>
            </div>
        </main>
    );
}

export default ClientPage;
