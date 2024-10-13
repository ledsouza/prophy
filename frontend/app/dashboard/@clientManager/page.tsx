"use client";

import React, { useEffect, useState } from "react";

import {
    Cliente,
    useListClientsQuery as getClients,
} from "@/redux/features/clienteApiSlice";
import {
    useListUnitsQuery as getUnits,
    Unidade,
} from "@/redux/features/unidadeApiSlice";

import { Typography } from "@/components/foundation";
import { Button, Spinner } from "@/components/common";
import { ClientInfo, UnitCard } from "@/components/client";
import { toast } from "react-toastify";
import { SelectData } from "@/components/forms/Select";

function ClientPage() {
    const {
        data: paginatedClientsData,
        isLoading: isLoadingClients,
        error: errorClients,
    } = getClients({ page: 1 });

    const {
        data: paginatedUnitsData,
        isLoading: isLoadingUnits,
        error: errorUnits,
    } = getUnits({
        page: 1,
    });

    useEffect(() => {
        if (errorClients) {
            console.error(errorClients);
            toast.error(
                "Erro ao carregar dados do cliente. Por favor, tente novamente mais tarde."
            );
        }
        if (errorUnits) {
            console.error(errorUnits);
            toast.error(
                "Erro ao carregar dados das unidades. Por favor, tente novamente mais tarde."
            );
        }
    }, [errorClients, errorUnits]);

    const unitsData = paginatedUnitsData?.results;
    const [selectedClient, setSelectedClient] = useState<SelectData | null>(
        null
    );
    const [filteredClient, setFilteredClient] = useState<Cliente | null>(null);
    const [filteredUnits, setfilteredUnits] = useState<Unidade[] | null>(null);

    useEffect(() => {
        if (paginatedClientsData?.results?.length) {
            const clientOptions = paginatedClientsData.results.map(
                (client) => ({
                    id: client.id,
                    value: client.nome_instituicao,
                })
            );
            setSelectedClient(clientOptions[0]);
            setFilteredClient(paginatedClientsData.results[0]);
        }
    }, [paginatedClientsData]);

    useEffect(() => {
        if (selectedClient && paginatedClientsData?.results) {
            const newFilteredClient = paginatedClientsData.results.find(
                (client) => client.id === selectedClient?.id
            );
            if (newFilteredClient) {
                setFilteredClient(newFilteredClient);
            }
            if (unitsData) {
                setfilteredUnits(
                    unitsData?.filter(
                        (unit) => unit.cliente === selectedClient.id
                    )
                );
            }
        }
    }, [selectedClient, paginatedClientsData]);

    if (isLoadingClients || isLoadingUnits) {
        return <Spinner lg />;
    }

    if (paginatedClientsData?.count === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-8">
                <Typography element="h2" size="title2" className="font-bold">
                    Nenhum dado encontrado
                </Typography>
                <Typography element="p" size="lg">
                    Não encontramos nenhum dado associado a essa conta! Por
                    favor, entre em contato conosco.
                </Typography>
                <Button onClick={() => window.location.reload()}>
                    Tentar novamente
                </Button>
            </div>
        );
    }

    const clientOptions = paginatedClientsData?.results.map((client) => ({
        id: client.id,
        value: client.nome_instituicao,
    }));

    return (
        <main className="flex gap-6">
            {clientOptions && selectedClient && filteredClient && (
                <ClientInfo
                    clientOptions={clientOptions}
                    selectedClient={selectedClient}
                    setSelectedClient={setSelectedClient}
                    filteredClient={filteredClient}
                />
            )}

            <div className="w-full flex flex-col gap-6 bg-white rounded-xl shadow-lg p-8">
                <Typography
                    element="h2"
                    size="title2"
                    className="mb-6 font-bold"
                >
                    Unidades
                </Typography>

                <div className="flex flex-col gap-6">
                    {filteredUnits ? (
                        filteredUnits?.map((unit) => (
                            <UnitCard
                                key={unit.id}
                                title={unit.nome}
                                status="Aceito"
                                equipmentsCount={2}
                            />
                        ))
                    ) : (
                        <Typography element="p" size="lg">
                            Nenhuma unidade encontrada
                        </Typography>
                    )}
                </div>

                <Button>Adicionar Unidade</Button>
            </div>
        </main>
    );
}

export default ClientPage;
