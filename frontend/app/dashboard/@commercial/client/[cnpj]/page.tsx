"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useSingleClientLoading } from "@/hooks";
import type { UnitDTO } from "@/redux/features/unitApiSlice";

import { ArrowFatLineLeftIcon } from "@phosphor-icons/react";

import { ClientDetails, UnitList } from "@/components/client";
import { Button, Spinner } from "@/components/common";
import { Input } from "@/components/forms";
import { Typography } from "@/components/foundation";

function ClientDetailPage() {
    const params = useParams();
    const router = useRouter();

    const cnpj = params.cnpj as string;

    const {
        isLoading: isLoadingClientData,
        hasNoData,
        clientNotFound,
        filteredClient,
        filteredUnits,
        clientsOperations,
    } = useSingleClientLoading(cnpj);

    const [searchTerm, setSearchTerm] = useState("");
    const [searchedUnits, setSearchedUnits] = useState<UnitDTO[]>([]);

    const handleBack = () => {
        router.back();
    };

    const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    // Filter units by search term
    useEffect(() => {
        if (filteredUnits && filteredUnits.length > 0) {
            if (searchTerm.length > 0) {
                const filtered = filteredUnits.filter((unit) =>
                    unit.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
                setSearchedUnits(filtered);
            } else {
                setSearchedUnits(filteredUnits);
            }
        } else {
            setSearchedUnits([]);
        }
    }, [filteredUnits, searchTerm]);

    if (isLoadingClientData) {
        return <Spinner fullscreen />;
    }

    if (clientNotFound) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-8">
                <Typography
                    element="h2"
                    size="title2"
                    className="font-bold"
                    dataTestId="client-not-found"
                >
                    Cliente não encontrado
                </Typography>
                <Typography element="p" size="lg">
                    Não foi possível encontrar um cliente com o CNPJ informado.
                </Typography>
                <Button onClick={handleBack} data-testid="btn-back-to-search">
                    Voltar à busca
                </Button>
            </div>
        );
    }

    if (hasNoData) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-8">
                <Typography
                    element="h2"
                    size="title2"
                    className="font-bold"
                    dataTestId="data-not-found"
                >
                    Nenhum dado encontrado
                </Typography>
                <Typography element="p" size="lg">
                    Não encontramos nenhum dado associado a essa conta! Por favor, entre em contato
                    conosco.
                </Typography>
                <Button onClick={() => router.refresh()} data-testid="btn-refresh">
                    Tentar novamente
                </Button>
            </div>
        );
    }

    return (
        <main className="flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row gap-6">
                <Button
                    variant="secondary"
                    className="fixed bottom-4 right-4 z-10 shadow-lg px-4 py-2"
                    disabled={isLoadingClientData}
                    onClick={handleBack}
                    data-testid="btn-back-to-search"
                >
                    <div className="flex items-center gap-2">
                        <ArrowFatLineLeftIcon size={24} /> Voltar
                    </div>
                </Button>

                {filteredClient && clientsOperations && (
                    <ClientDetails
                        title="Informações do cliente"
                        isLoading={isLoadingClientData}
                        clientOptions={[]} // Empty array since COMMERCIAL role only has view access
                        selectedClient={{ id: filteredClient.id, value: filteredClient.name }}
                        setSelectedClient={() => {}} // No-op since COMMERCIAL role cannot change clients
                        filteredClient={filteredClient}
                        selectedClientInOperation={null} // COMMERCIAL role cannot see operations
                        hideClientSelector={true}
                    />
                )}

                <div className="w-full md:w-2/3 h-[60vh] md:h-[80vh] flex flex-col min-h-0 gap-6 bg-white rounded-xl shadow-lg p-6 md:p-8">
                    <Typography element="h2" size="title2" className="font-bold">
                        Unidades
                    </Typography>

                    {filteredUnits && filteredUnits.length > 0 && (
                        <Input
                            placeholder="Buscar unidades por nome"
                            value={searchTerm}
                            onChange={handleSearchInputChange}
                            dataTestId="input-search-unit"
                        />
                    )}

                    <div className="flex-1 overflow-y-auto [scrollbar-gutter:stable] px-3 py-3">
                        <UnitList
                            searchedUnits={searchedUnits}
                            filteredUnits={filteredUnits}
                            emptyStateMessage={{
                                noUnitsRegistered: "Nenhuma unidade registrada",
                                noUnitsFound: "Nenhuma unidade encontrada para o termo pesquisado",
                            }}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}

export default ClientDetailPage;
