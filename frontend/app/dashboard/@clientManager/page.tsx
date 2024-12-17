"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { UnitDTO } from "@/redux/features/unitApiSlice";

import { useClientDataLoading } from "@/hooks/use-client-data-loading";

import { EditClientForm, Input } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { Button, Modal, Spinner } from "@/components/common";
import { ClientDetails, UnitCard } from "@/components/client";

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

    const [searchedUnits, setSearchedUnits] = useState<UnitDTO[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const handleSearchInputChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setSearchTerm(event.target.value);
    };

    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (filteredUnits && filteredUnits.length > 0) {
            if (searchTerm.length > 0) {
                setSearchedUnits(
                    filteredUnits.filter((unit) =>
                        unit.name
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                    )
                );
            } else {
                setSearchedUnits(filteredUnits);
            }
        } else {
            setSearchedUnits([]);
        }
    }, [filteredUnits, searchTerm]);

    if (isLoading) {
        return <Spinner fullscreen />;
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
                    Não encontramos nenhum dado associado a essa conta! Por
                    favor, entre em contato conosco.
                </Typography>
                <Button
                    onClick={() => router.refresh()}
                    data-testid="btn-refresh"
                >
                    Tentar novamente
                </Button>
            </div>
        );
    }

    return (
        <main className="flex flex-col md:flex-row gap-6 px-4 md:px-6 lg:px-8 py-4">
            {clientOptions && selectedClient && filteredClient && (
                <ClientDetails
                    clientOptions={clientOptions}
                    selectedClient={selectedClient}
                    setSelectedClient={setSelectedClient}
                    filteredClient={filteredClient}
                    handleEdit={() => setIsModalOpen(true)}
                />
            )}

            <div className="w-full md:w-2/3 h-[60vh] md:h-[80vh] overflow-y-auto flex flex-col gap-6 bg-white rounded-xl shadow-lg p-6 md:p-8">
                <Typography element="h2" size="title2" className="font-bold">
                    Unidades
                </Typography>

                {filteredUnits?.length !== 0 && (
                    <Input
                        placeholder="Buscar unidades por nome"
                        value={searchTerm}
                        onChange={handleSearchInputChange}
                        dataTestId="input-search-unit"
                    />
                )}

                <div className="flex flex-col gap-6">
                    {searchedUnits && searchedUnits.length > 0 ? (
                        searchedUnits?.map((unit) => (
                            <UnitCard
                                key={unit.id}
                                title={unit.name}
                                status="Aceito"
                                equipmentsCount={
                                    equipments.filter(
                                        (equipment) =>
                                            equipment.unit === unit.id
                                    ).length
                                }
                                onClick={() =>
                                    router.push(`/dashboard/unit/${unit.id}`)
                                }
                                dataTestId={`unit-card-${unit.id}`}
                            />
                        ))
                    ) : (
                        <Typography
                            element="p"
                            size="lg"
                            dataTestId="unit-not-found"
                            className="justify-center text-center"
                        >
                            {filteredUnits?.length === 0
                                ? "Nenhuma unidade registrada"
                                : "Nenhuma unidade encontrada para o termo pesquisado"}
                        </Typography>
                    )}
                </div>

                <Button data-testid="btn-add-unit">Adicionar unidade</Button>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                className="max-w-lg"
            >
                <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-md">
                    <EditClientForm
                        originalClient={filteredClient!}
                        setIsModalOpen={setIsModalOpen}
                    />
                </div>
            </Modal>
        </main>
    );
}

export default ClientPage;
