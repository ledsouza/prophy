"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { mask as cnpjMask } from "validation-br/dist/cnpj";
import { FileText, Info, Warning } from "@phosphor-icons/react";

import { ClientDTO, useListClientsQuery } from "@/redux/features/clientApiSlice";
import { SelectData } from "@/components/forms/Select";
import { ITEMS_PER_PAGE } from "@/constants/pagination";
import { usePendingOperations } from "@/hooks";

import { Typography } from "@/components/foundation";
import { Input, Select } from "@/components/forms";
import { Button, ErrorDisplay, Pagination, Spinner, Table, Tab } from "@/components/common";

import { SearchTab } from "@/types/search";
import {
    USER_ROLE_OPTIONS,
    CONTRACT_TYPE_OPTIONS,
    OPERATION_STATUS_OPTIONS,
} from "@/constants/search";
import { buildUrlParams, FilterParams } from "@/utils/urlUtils";
import {
    restoreTabState,
    restorePageState,
    restoreFilterStatesFromUrl,
    restoreSelectOptions,
    getUserRoleFromOptionId,
    getContractTypeFromOptionId,
    getOperationStatusFromOptionId,
    applyFiltersFromUrl,
} from "@/utils/stateUtils";

function SearchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const { hasPendingOperations, isLoading: isPendingLoading } = usePendingOperations();

    const [selectedTabIndex, setSelectedTabIndex] = useState(SearchTab.CLIENTS);

    const [currentPage, setCurrentPage] = useState(1);
    const [appliedFilters, setAppliedFilters] = useState({
        name: "",
        cnpj: "",
        city: "",
        user_role: "",
        contract_type: "",
        operation_status: "",
    });

    const [selectedName, setSelectedName] = useState("");
    const [selectedCnpj, setSelectedCnpj] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [selectedUserRole, setSelectedUserRole] = useState<SelectData>({ id: 0, value: "Todos" });
    const [selectedContractType, setSelectedContractType] = useState<SelectData>({
        id: 0,
        value: "Todos",
    });
    const [selectedOperationStatus, setSelectedOperationStatus] = useState<SelectData>({
        id: 0,
        value: "Todos",
    });

    const queryParams = useMemo(() => {
        const params: any = { page: currentPage };

        if (appliedFilters.name) params.name = appliedFilters.name;
        if (appliedFilters.cnpj) params.cnpj = appliedFilters.cnpj;
        if (appliedFilters.city) params.city = appliedFilters.city;
        if (appliedFilters.user_role) params.user_role = appliedFilters.user_role;
        if (appliedFilters.contract_type) params.contract_type = appliedFilters.contract_type;
        if (appliedFilters.operation_status)
            params.operation_status = appliedFilters.operation_status;

        return params;
    }, [currentPage, appliedFilters]);

    const { data: clientsData, isLoading, error } = useListClientsQuery(queryParams);

    const clients = clientsData?.results || [];
    const totalClientsCount = clientsData?.count || 0;

    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        const name = params.get("name") || "";
        const cnpj = params.get("cnpj") || "";
        const city = params.get("city") || "";
        const roleId = params.get("role");
        const contractTypeId = params.get("contract");
        const operationStatusId = params.get("status");
        const pageParam = params.get("page");
        const tabParam = params.get("tab");

        restoreTabState(tabParam, setSelectedTabIndex);
        restorePageState(pageParam, currentPage, setCurrentPage);
        restoreFilterStatesFromUrl(
            name,
            cnpj,
            city,
            setSelectedName,
            setSelectedCnpj,
            setSelectedCity
        );
        restoreSelectOptions(
            roleId,
            contractTypeId,
            operationStatusId,
            USER_ROLE_OPTIONS,
            CONTRACT_TYPE_OPTIONS,
            OPERATION_STATUS_OPTIONS,
            setSelectedUserRole,
            setSelectedContractType,
            setSelectedOperationStatus
        );
        applyFiltersFromUrl(
            name,
            cnpj,
            city,
            roleId,
            contractTypeId,
            operationStatusId,
            setAppliedFilters
        );
    }, [searchParams]);

    const handleTabChange = (index: number) => {
        setSelectedTabIndex(index);
        setCurrentPage(1);

        const filterParams: FilterParams = {
            name: selectedName,
            cnpj: selectedCnpj,
            city: selectedCity,
            userRoleId: selectedUserRole.id,
            contractTypeId: selectedContractType.id,
            operationStatusId: selectedOperationStatus.id,
        };

        const params = buildUrlParams(filterParams, index as SearchTab, 1);
        router.push(`?${params.toString()}`);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);

        const filterParams: FilterParams = {
            name: selectedName,
            cnpj: selectedCnpj,
            city: selectedCity,
            userRoleId: selectedUserRole.id,
            contractTypeId: selectedContractType.id,
            operationStatusId: selectedOperationStatus.id,
        };

        const params = buildUrlParams(filterParams, selectedTabIndex, page);
        router.push(`?${params.toString()}`);
    };

    const handleApplyFilters = () => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        }

        const filters = {
            name: selectedName,
            cnpj: selectedCnpj,
            city: selectedCity,
            user_role: getUserRoleFromOptionId(selectedUserRole.id),
            contract_type: getContractTypeFromOptionId(selectedContractType.id),
            operation_status: getOperationStatusFromOptionId(selectedOperationStatus.id),
        };

        setAppliedFilters(filters);

        const filterParams: FilterParams = {
            name: selectedName,
            cnpj: selectedCnpj,
            city: selectedCity,
            userRoleId: selectedUserRole.id,
            contractTypeId: selectedContractType.id,
            operationStatusId: selectedOperationStatus.id,
        };

        const params = buildUrlParams(filterParams, selectedTabIndex, 1);

        router.push(`?${params.toString()}`);
    };

    const handleClearFilters = () => {
        setSelectedName("");
        setSelectedCnpj("");
        setSelectedCity("");
        setSelectedUserRole({ id: 0, value: "Todos" });
        setSelectedContractType({ id: 0, value: "Todos" });
        setSelectedOperationStatus({ id: 0, value: "Todos" });

        setCurrentPage(1);

        setAppliedFilters({
            name: "",
            cnpj: "",
            city: "",
            user_role: "",
            contract_type: "",
            operation_status: "",
        });

        const params = buildUrlParams({}, selectedTabIndex, 1);
        router.push(`?${params.toString()}`);
    };

    const handleViewProposals = (cnpj: string) => {
        router.push(`/dashboard/proposals?cnpj=${cnpj}`);
    };

    const handleViewDetails = (cnpj: string) => {
        router.push(`/dashboard/client/${cnpj}`);
    };

    if (isLoading) {
        return <Spinner fullscreen />;
    }

    if (error) {
        return (
            <ErrorDisplay
                title="Erro ao carregar dados"
                message="Ocorreu um erro ao carregar os dados dos clientes. Tente novamente mais tarde."
            />
        );
    }

    return (
        <main className="flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-4">
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                <Typography element="h1" size="title2" className="font-bold mb-6">
                    Buscar
                </Typography>

                <TabGroup selectedIndex={selectedTabIndex} onChange={handleTabChange}>
                    <TabList className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
                        <Tab>Clientes</Tab>
                        <Tab>Equipamentos</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel>
                            {/* Client Search Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                <Input
                                    value={selectedName}
                                    onChange={(e) => setSelectedName(e.target.value)}
                                    placeholder="Digite o nome do cliente"
                                >
                                    Nome
                                </Input>

                                <Input
                                    value={selectedCnpj}
                                    onChange={(e) => setSelectedCnpj(e.target.value)}
                                    placeholder="Digite o CNPJ"
                                >
                                    CNPJ
                                </Input>

                                <Input
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                    placeholder="Digite a cidade"
                                >
                                    Cidade
                                </Input>

                                <Select
                                    options={USER_ROLE_OPTIONS}
                                    selectedData={selectedUserRole}
                                    setSelect={setSelectedUserRole}
                                    label="Perfil de Usuário"
                                    dataTestId="filter-user-role"
                                />

                                <Select
                                    options={CONTRACT_TYPE_OPTIONS}
                                    selectedData={selectedContractType}
                                    setSelect={setSelectedContractType}
                                    label="Tipo de Contrato"
                                    dataTestId="filter-contract-type"
                                />

                                <div className="relative">
                                    <div className="flex items-start gap-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <label className="block">Status de Operações</label>
                                                {hasPendingOperations && !isPendingLoading && (
                                                    <div className="group relative">
                                                        <Warning
                                                            size={16}
                                                            className="text-warning cursor-help"
                                                            weight="fill"
                                                        />
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                            Existem operações pendentes de revisão
                                                            no sistema
                                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <Select
                                                options={OPERATION_STATUS_OPTIONS}
                                                selectedData={selectedOperationStatus}
                                                setSelect={setSelectedOperationStatus}
                                                label=""
                                                dataTestId="filter-operation-status"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                <Button
                                    onClick={handleApplyFilters}
                                    className="flex-1 sm:flex-initial"
                                    disabled={isLoading}
                                    data-testid="btn-apply-filters"
                                >
                                    {isLoading ? "Carregando..." : "Aplicar Filtros"}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={handleClearFilters}
                                    className="flex-1 sm:flex-initial"
                                    disabled={isLoading}
                                    data-testid="btn-clear-filters"
                                >
                                    Limpar Filtros
                                </Button>
                            </div>

                            {/* Client Results Section */}
                            <div className="bg-gray-50 rounded-xl p-6">
                                <Typography element="h2" size="title3" className="font-bold mb-4">
                                    Resultados da Busca
                                </Typography>

                                {clients.length === 0 && !isLoading ? (
                                    <div className="text-center py-8">
                                        <Typography
                                            element="p"
                                            size="lg"
                                            className="text-gray-secondary"
                                        >
                                            Nenhum cliente encontrado com os filtros aplicados
                                        </Typography>
                                    </div>
                                ) : (
                                    <div>
                                        {isLoading && (
                                            <div className="flex justify-center py-8">
                                                <Spinner />
                                            </div>
                                        )}

                                        {!isLoading && (
                                            <Table
                                                data={clients}
                                                columns={[
                                                    {
                                                        header: "Nome",
                                                        cell: (client: ClientDTO) => client.name,
                                                    },
                                                    {
                                                        header: "CNPJ",
                                                        cell: (client: ClientDTO) =>
                                                            cnpjMask(client.cnpj),
                                                    },
                                                    {
                                                        header: "Endereço",
                                                        cell: (client: ClientDTO) =>
                                                            `${client.address} - ${client.state}, ${client.city}`,
                                                    },
                                                    {
                                                        header: "Usuários",
                                                        cell: (client: ClientDTO) =>
                                                            client.users.length > 0 ? (
                                                                <div className="space-y-1">
                                                                    {client.users.map(
                                                                        (user, userIndex) => (
                                                                            <div
                                                                                key={userIndex}
                                                                                className="text-xs"
                                                                            >
                                                                                <span className="font-medium">
                                                                                    {user.role ===
                                                                                        "FMI" &&
                                                                                        "Físico Médico Interno"}
                                                                                    {user.role ===
                                                                                        "FME" &&
                                                                                        "Físico Médico Externo"}
                                                                                    {user.role ===
                                                                                        "GP" &&
                                                                                        "Gerente Prophy"}
                                                                                    {user.role ===
                                                                                        "GGC" &&
                                                                                        "Gerente Geral de Cliente"}
                                                                                    {user.role ===
                                                                                        "GU" &&
                                                                                        "Gerente de Unidade"}
                                                                                    {user.role ===
                                                                                        "C" &&
                                                                                        "Comercial"}
                                                                                </span>
                                                                                : {user.name}
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-secondary">
                                                                    Nenhum usuário
                                                                </span>
                                                            ),
                                                    },
                                                    {
                                                        header: "Ações",
                                                        cell: (client: ClientDTO) => (
                                                            <div className="flex flex-col gap-2">
                                                                <Button
                                                                    variant="primary"
                                                                    onClick={() =>
                                                                        handleViewDetails(
                                                                            client.cnpj
                                                                        )
                                                                    }
                                                                    className="flex items-center gap-2 text-xs"
                                                                >
                                                                    <Info size={16} />
                                                                    Detalhes
                                                                </Button>

                                                                <Button
                                                                    variant="primary"
                                                                    onClick={() =>
                                                                        handleViewProposals(
                                                                            client.cnpj
                                                                        )
                                                                    }
                                                                    className="flex items-center gap-2 px-2 py-1 text-xs"
                                                                >
                                                                    <FileText size={16} />
                                                                    Propostas
                                                                </Button>
                                                            </div>
                                                        ),
                                                    },
                                                ]}
                                                keyExtractor={(client: ClientDTO) => client.id}
                                            />
                                        )}

                                        {/* Pagination */}
                                        {!isLoading && totalClientsCount > ITEMS_PER_PAGE && (
                                            <div className="mt-6">
                                                <Pagination
                                                    currentPage={currentPage}
                                                    totalCount={totalClientsCount}
                                                    itemsPerPage={ITEMS_PER_PAGE}
                                                    onPageChange={handlePageChange}
                                                    isLoading={isLoading}
                                                />
                                            </div>
                                        )}

                                        {/* Results Summary */}
                                        {!isLoading && (
                                            <div className="mt-4 text-center">
                                                <Typography
                                                    element="p"
                                                    size="sm"
                                                    className="text-gray-secondary"
                                                >
                                                    {totalClientsCount > 0 && (
                                                        <>
                                                            Mostrando{" "}
                                                            {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                                                            -
                                                            {Math.min(
                                                                currentPage * ITEMS_PER_PAGE,
                                                                totalClientsCount
                                                            )}{" "}
                                                            de {totalClientsCount} cliente(s)
                                                        </>
                                                    )}
                                                    {totalClientsCount === 0 &&
                                                        "Nenhum cliente encontrado"}
                                                </Typography>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TabPanel>

                        <TabPanel>
                            {/* Equipment Search Content - Placeholder */}
                            <div className="text-center py-8">
                                <Typography element="p" size="lg" className="text-gray-secondary">
                                    Busca de equipamentos será implementada em breve
                                </Typography>
                            </div>
                        </TabPanel>
                    </TabPanels>
                </TabGroup>
            </div>
        </main>
    );
}

export default SearchPage;
