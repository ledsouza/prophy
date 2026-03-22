"use client";

import { useMemo, useState } from "react";
import { mask as cnpjMask } from "validation-br/dist/cnpj";
import { useRouter, useSearchParams } from "next/navigation";

import { ITEMS_PER_PAGE } from "@/constants/pagination";
import {
    useFilterApplication,
    useFilterClear,
    useFilterRestoration,
    usePageNavigation,
} from "@/hooks";
import { useListClientsQuery } from "@/redux/features/clientApiSlice";
import type { ClientDTO } from "@/types/client";
import { restoreTextFilterStates } from "@/utils/filter-restoration";

import {
    Button,
    ErrorDisplay,
    MobileResultCard,
    Pagination,
    Spinner,
    Table,
} from "@/components/common";
import { Input } from "@/components/forms";
import { Typography } from "@/components/foundation";

type MedicalPhysicistClientFilters = {
    name: string;
    cnpj: string;
    city: string;
};

type MedicalPhysicistClientSearchSectionProps = {
    dataCyPrefix: string;
};

const EMPTY_FILTERS: MedicalPhysicistClientFilters = {
    name: "",
    cnpj: "",
    city: "",
};

export default function MedicalPhysicistClientSearchSection({
    dataCyPrefix,
}: MedicalPhysicistClientSearchSectionProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [currentPage, setCurrentPage] = useState(1);
    const [appliedFilters, setAppliedFilters] =
        useState<MedicalPhysicistClientFilters>(EMPTY_FILTERS);

    const [selectedClientName, setSelectedClientName] = useState("");
    const [selectedClientCnpj, setSelectedClientCnpj] = useState("");
    const [selectedClientCity, setSelectedClientCity] = useState("");

    const queryParams = useMemo(() => {
        const params: MedicalPhysicistClientFilters & { page: number } = {
            page: currentPage,
            ...appliedFilters,
        };

        return params;
    }, [appliedFilters, currentPage]);

    const {
        data: clientsData,
        isLoading: clientsLoading,
        error: clientsError,
    } = useListClientsQuery(queryParams);

    const clients = useMemo(() => clientsData?.results || [], [clientsData?.results]);
    const totalClientsCount = clientsData?.count || 0;

    const buildFilters = () => ({
        name: selectedClientName,
        cnpj: selectedClientCnpj,
        city: selectedClientCity,
    });

    const { handlePageChange } = usePageNavigation({
        tabName: "clients",
        pageKey: "client_page",
        buildFilters,
        setCurrentPage,
    });

    const { handleApplyFilters } = useFilterApplication({
        tabName: "clients",
        pageKey: "client_page",
        currentPage,
        setCurrentPage,
        setAppliedFilters,
        buildFilters,
    });

    const { handleClearFilters } = useFilterClear<MedicalPhysicistClientFilters>({
        tabName: "clients",
        pageKey: "client_page",
        setCurrentPage,
        setAppliedFilters,
        resetFilters: () => {
            setSelectedClientName("");
            setSelectedClientCnpj("");
            setSelectedClientCity("");
        },
        emptyFilters: EMPTY_FILTERS,
    });

    useFilterRestoration({
        searchParams,
        setSelectedTabIndex: () => {},
        getTabFromParam: () => 0,
        tabs: {
            0: {
                pageParam: "client_page",
                currentPage,
                setCurrentPage,
                restoreFilters: (params) => {
                    restoreTextFilterStates(
                        params.get("clients_name") || "",
                        setSelectedClientName,
                    );
                    restoreTextFilterStates(
                        params.get("clients_cnpj") || "",
                        setSelectedClientCnpj,
                    );
                    restoreTextFilterStates(
                        params.get("clients_city") || "",
                        setSelectedClientCity,
                    );
                },
                setAppliedFilters,
                buildAppliedFilters: (params) => ({
                    name: params.get("clients_name") || "",
                    cnpj: params.get("clients_cnpj") || "",
                    city: params.get("clients_city") || "",
                }),
            },
        },
    });

    if (clientsLoading && !clientsData) {
        return <Spinner fullscreen />;
    }

    if (clientsError) {
        return (
            <ErrorDisplay
                title="Erro ao carregar dados"
                message="Ocorreu um erro ao carregar os dados dos clientes. Tente novamente mais tarde."
            />
        );
    }

    return (
        <div>
            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-3">
                <Input
                    value={selectedClientName}
                    onChange={(e) => setSelectedClientName(e.target.value)}
                    placeholder="Digite o nome do cliente"
                    label="Nome"
                    dataCy={`${dataCyPrefix}-clients-filter-name`}
                />

                <Input
                    value={selectedClientCnpj}
                    onChange={(e) => setSelectedClientCnpj(e.target.value)}
                    placeholder="Digite o CNPJ"
                    label="CNPJ"
                    dataCy={`${dataCyPrefix}-clients-filter-cnpj`}
                />

                <Input
                    value={selectedClientCity}
                    onChange={(e) => setSelectedClientCity(e.target.value)}
                    placeholder="Digite a cidade"
                    label="Cidade"
                    dataCy={`${dataCyPrefix}-clients-filter-city`}
                />
            </div>

            <div className="flex flex-col gap-3 mb-6 sm:flex-row">
                <Button
                    onClick={handleApplyFilters}
                    className="flex-1 sm:flex-initial"
                    disabled={clientsLoading}
                    dataCy={`${dataCyPrefix}-clients-apply-filters`}
                >
                    {clientsLoading ? "Carregando..." : "Aplicar Filtros"}
                </Button>

                <Button
                    variant="secondary"
                    onClick={handleClearFilters}
                    className="flex-1 sm:flex-initial"
                    disabled={clientsLoading}
                    dataCy={`${dataCyPrefix}-clients-clear-filters`}
                >
                    Limpar Filtros
                </Button>
            </div>

            <div className="results-panel p-4 sm:p-6" data-cy={`${dataCyPrefix}-clients-results`}>
                <Typography element="h2" size="title3" className="font-bold mb-4">
                    Resultados
                </Typography>

                {clients.length === 0 && !clientsLoading ? (
                    <div className="py-8 text-center">
                        <Typography element="p" size="lg" className="text-gray-secondary">
                            Nenhum cliente encontrado com os filtros aplicados
                        </Typography>
                    </div>
                ) : (
                    <div>
                        {clientsLoading && (
                            <div className="flex justify-center py-8">
                                <Spinner />
                            </div>
                        )}

                        {!clientsLoading && (
                            <Table
                                data={clients}
                                columns={[
                                    {
                                        header: "Nome",
                                        cell: (client: ClientDTO) => client.name,
                                    },
                                    {
                                        header: "CNPJ",
                                        cell: (client: ClientDTO) => cnpjMask(client.cnpj),
                                    },
                                    {
                                        header: "Endereço",
                                        cell: (client: ClientDTO) =>
                                            `${client.address} - ${client.state}, ${client.city}`,
                                    },
                                    {
                                        header: "Ações",
                                        cell: (client: ClientDTO) => (
                                            <Button
                                                variant="primary"
                                                onClick={() =>
                                                    router.push(`/dashboard/client/${client.cnpj}`)
                                                }
                                                className="flex items-center gap-2 text-xs"
                                                dataCy={`${dataCyPrefix}-client-details-${client.id}`}
                                            >
                                                Detalhes
                                            </Button>
                                        ),
                                    },
                                ]}
                                keyExtractor={(client: ClientDTO) => client.id}
                                mobileCardRenderer={(client: ClientDTO) => (
                                    <MobileResultCard
                                        dataCy={`${dataCyPrefix}-client-card-${client.id}`}
                                        title={client.name}
                                        fields={[
                                            {
                                                label: "CNPJ",
                                                value: cnpjMask(client.cnpj),
                                            },
                                            {
                                                label: "Endereço",
                                                value: `${client.address} - ${client.state}, ${client.city}`,
                                            },
                                        ]}
                                        actions={
                                            <Button
                                                variant="primary"
                                                onClick={() =>
                                                    router.push(`/dashboard/client/${client.cnpj}`)
                                                }
                                                className="flex items-center gap-2 text-xs"
                                                dataCy={`${dataCyPrefix}-client-details-mobile-${client.id}`}
                                            >
                                                Detalhes
                                            </Button>
                                        }
                                    />
                                )}
                                rowProps={(client: ClientDTO) => ({
                                    "data-cy": `${dataCyPrefix}-client-row-${client.id}`,
                                })}
                            />
                        )}

                        {!clientsLoading && totalClientsCount > ITEMS_PER_PAGE && (
                            <div className="mt-6">
                                <Pagination
                                    currentPage={currentPage}
                                    totalCount={totalClientsCount}
                                    itemsPerPage={ITEMS_PER_PAGE}
                                    onPageChange={handlePageChange}
                                    isLoading={clientsLoading}
                                />
                            </div>
                        )}

                        {!clientsLoading && (
                            <div className="mt-4 text-center">
                                <Typography
                                    element="p"
                                    size="sm"
                                    className="text-gray-secondary"
                                >
                                    {totalClientsCount > 0 && (
                                        <>
                                            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                                            {Math.min(
                                                currentPage * ITEMS_PER_PAGE,
                                                totalClientsCount,
                                            )}{" "}
                                            de {totalClientsCount} cliente(s)
                                        </>
                                    )}
                                    {totalClientsCount === 0 && "Nenhum cliente encontrado"}
                                </Typography>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}