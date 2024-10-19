"use client";

import { useRouter } from "next/navigation";

import { Typography } from "@/components/foundation";
import { Button, Spinner } from "@/components/common";
import { ClientInfo, UnitCard } from "@/components/client";
import { useClientDataLoading } from "@/hooks/use-client-data-loading";

function ClientPage() {
    const router = useRouter();
    const {
        isLoading,
        hasNoData,
        clientOptions,
        selectedClient,
        filteredClient,
        filteredUnits,
        equipments,
        setSelectedClient,
    } = useClientDataLoading();

    if (isLoading) {
        return <Spinner lg />;
    }

    if (hasNoData) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-8">
                <Typography element="h2" size="title2" className="font-bold">
                    Nenhum dado encontrado
                </Typography>
                <Typography element="p" size="lg">
                    Não encontramos nenhum dado associado a essa conta! Por
                    favor, entre em contato conosco.
                </Typography>
                <Button onClick={() => router.refresh()}>
                    Tentar novamente
                </Button>
            </div>
        );
    }

    return (
        <main className="flex flex-col md:flex-row gap-6 px-4 md:px-6 lg:px-8 py-4">
            {clientOptions && selectedClient && filteredClient && (
                <ClientInfo
                    clientOptions={clientOptions}
                    selectedClient={selectedClient}
                    setSelectedClient={setSelectedClient}
                    filteredClient={filteredClient}
                />
            )}

            <div className="w-full md:w-2/3 h-[60vh] md:h-[80vh] overflow-y-auto flex flex-col gap-6 bg-white rounded-xl shadow-lg p-6 md:p-8">
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
                                equipmentsCount={
                                    equipments.filter(
                                        (equipment) =>
                                            equipment.unidade === unit.id
                                    ).length
                                }
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
