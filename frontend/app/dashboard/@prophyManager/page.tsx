"use client";

import { useState, useEffect, useMemo } from "react";
import { mask as cnpjMask } from "validation-br/dist/cnpj";
import { FileText, Warning } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";

import { ClientDTO, useListClientsQuery } from "@/redux/features/clientApiSlice";
import { SelectData } from "@/components/forms/Select";
import { ITEMS_PER_PAGE } from "@/constants/pagination";
import { usePendingOperations } from "@/hooks";

import { Typography } from "@/components/foundation";
import { Input, Select } from "@/components/forms";
import { Button, ErrorDisplay, Pagination, Spinner, Table } from "@/components/common";

function SearchClientPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check for pending operations
    const { hasPendingOperations, isLoading: isPendingLoading } = usePendingOperations();

    // Pagination and filter states
    const [currentPage, setCurrentPage] = useState(1);
    const [appliedFilters, setAppliedFilters] = useState({
        name: "",
        cnpj: "",
        city: "",
        user_role: "",
        contract_type: "",
        operation_status: "",
    });

    // Form filter states (for UI only, before applying)
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

    // Build API query parameters
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

    // API query with server-side filtering
    const { data: clientsData, isLoading, error } = useListClientsQuery(queryParams);

    // Extract clients from paginated response
    const clients = clientsData?.results || [];
    const totalClientsCount = clientsData?.count || 0;

    // Handle URL parameters restoration on mount
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        const name = params.get("name") || "";
        const cnpj = params.get("cnpj") || "";
        const city = params.get("city") || "";
        const roleId = params.get("role");
        const contractTypeId = params.get("contract");
        const operationStatusId = params.get("status");
        const pageParam = params.get("page");

        // Restore page from URL if available
        if (pageParam) {
            const page = parseInt(pageParam, 10);
            if (page > 0 && page !== currentPage) {
                setCurrentPage(page);
            }
        }

        // Restore filter states from URL
        setSelectedName(name);
        setSelectedCnpj(cnpj);
        setSelectedCity(city);

        if (roleId) {
            const role = userRoleOptions.find((r) => r.id === Number(roleId));
            if (role) setSelectedUserRole(role);
        }
        if (contractTypeId) {
            const contract = contractTypeOptions.find((c) => c.id === Number(contractTypeId));
            if (contract) setSelectedContractType(contract);
        }
        if (operationStatusId) {
            const status = operationStatusOptions.find((s) => s.id === Number(operationStatusId));
            if (status) setSelectedOperationStatus(status);
        }

        // Apply filters from URL
        const filters = {
            name,
            cnpj,
            city,
            user_role: getUserRoleFromOptionId(Number(roleId) || 0),
            contract_type: getContractTypeFromOptionId(Number(contractTypeId) || 0),
            operation_status: getOperationStatusFromOptionId(Number(operationStatusId) || 0),
        };

        setAppliedFilters(filters);
    }, [searchParams]);

    const userRoleOptions: SelectData[] = [
        { id: 0, value: "Todos" },
        { id: 1, value: "Físico Médico Interno" },
        { id: 2, value: "Físico Médico Externo" },
        { id: 3, value: "Gerente Prophy" },
        { id: 4, value: "Gerente Geral de Cliente" },
        { id: 5, value: "Gerente de Unidade" },
        { id: 6, value: "Comercial" },
    ];

    const contractTypeOptions: SelectData[] = [
        { id: 0, value: "Todos" },
        { id: 1, value: "Anual" },
        { id: 2, value: "Mensal" },
        { id: 3, value: "Semanal" },
    ];

    const operationStatusOptions: SelectData[] = [
        { id: 0, value: "Todos" },
        { id: 1, value: "Com Operações Pendentes" },
        { id: 2, value: "Sem Operações Pendentes" },
    ];

    const getUserRoleFromOptionId = (optionId: number): string => {
        const roleMap: { [key: number]: string } = {
            1: "FMI",
            2: "FME",
            3: "GP",
            4: "GGC",
            5: "GU",
            6: "C",
        };
        return roleMap[optionId] || "";
    };

    const getContractTypeFromOptionId = (optionId: number): string => {
        const contractMap: { [key: number]: string } = {
            1: "A",
            2: "M",
            3: "W",
        };
        return contractMap[optionId] || "";
    };

    const getOperationStatusFromOptionId = (optionId: number): string => {
        const statusMap: { [key: number]: string } = {
            1: "pending",
            2: "none",
        };
        return statusMap[optionId] || "";
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);

        // Update URL with new page
        const params = new URLSearchParams(searchParams);
        if (selectedName) params.set("name", selectedName);
        if (selectedCnpj) params.set("cnpj", selectedCnpj);
        if (selectedCity) params.set("city", selectedCity);
        if (selectedUserRole.id !== 0) params.set("role", selectedUserRole.id.toString());
        if (selectedContractType.id !== 0)
            params.set("contract", selectedContractType.id.toString());
        if (selectedOperationStatus.id !== 0)
            params.set("status", selectedOperationStatus.id.toString());
        params.set("page", page.toString());

        router.push(`?${params.toString()}`);
    };

    const handleApplyFilters = () => {
        // Reset to page 1 when applying new filters
        if (currentPage !== 1) {
            setCurrentPage(1);
        }

        // Apply the filters to trigger server-side filtering
        const filters = {
            name: selectedName,
            cnpj: selectedCnpj,
            city: selectedCity,
            user_role: getUserRoleFromOptionId(selectedUserRole.id),
            contract_type: getContractTypeFromOptionId(selectedContractType.id),
            operation_status: getOperationStatusFromOptionId(selectedOperationStatus.id),
        };

        setAppliedFilters(filters);

        const params = new URLSearchParams();
        if (selectedName) params.set("name", selectedName);
        if (selectedCnpj) params.set("cnpj", selectedCnpj);
        if (selectedCity) params.set("city", selectedCity);
        if (selectedUserRole.id !== 0) params.set("role", selectedUserRole.id.toString());
        if (selectedContractType.id !== 0)
            params.set("contract", selectedContractType.id.toString());
        if (selectedOperationStatus.id !== 0)
            params.set("status", selectedOperationStatus.id.toString());
        // Always reset to page 1 when applying filters
        params.set("page", "1");
        router.push(`?${params.toString()}`);
    };

    const handleClearFilters = () => {
        setSelectedName("");
        setSelectedCnpj("");
        setSelectedCity("");
        setSelectedUserRole({ id: 0, value: "Todos" });
        setSelectedContractType({ id: 0, value: "Todos" });
        setSelectedOperationStatus({ id: 0, value: "Todos" });

        // Reset to page 1 when clearing filters
        setCurrentPage(1);

        // Clear applied filters
        setAppliedFilters({
            name: "",
            cnpj: "",
            city: "",
            user_role: "",
            contract_type: "",
            operation_status: "",
        });

        router.push("?page=1");
    };

    const handleViewProposals = (cnpj: string) => {
        router.push(`/dashboard/proposals?cnpj=${cnpj}`);
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
            {/* Search Filters Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                <Typography element="h1" size="title2" className="font-bold mb-6">
                    Buscar Cliente
                </Typography>

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
                        options={userRoleOptions}
                        selectedData={selectedUserRole}
                        setSelect={setSelectedUserRole}
                        label="Perfil de Usuário"
                        dataTestId="filter-user-role"
                    />

                    <Select
                        options={contractTypeOptions}
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
                                                Existem operações pendentes de revisão no sistema
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Select
                                    options={operationStatusOptions}
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
                <div className="flex flex-col sm:flex-row gap-3">
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
            </div>

            {/* Results Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                <Typography element="h2" size="title3" className="font-bold mb-4">
                    Resultados da Busca
                </Typography>

                {clients.length === 0 && !isLoading ? (
                    <div className="text-center py-8">
                        <Typography element="p" size="lg" className="text-gray-secondary">
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
                                        cell: (client: ClientDTO) => cnpjMask(client.cnpj),
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
                                                    {client.users.map((user, userIndex) => (
                                                        <div key={userIndex} className="text-xs">
                                                            <span className="font-medium">
                                                                {user.role === "FMI" &&
                                                                    "Físico Médico Interno"}
                                                                {user.role === "FME" &&
                                                                    "Físico Médico Externo"}
                                                                {user.role === "GP" &&
                                                                    "Gerente Prophy"}
                                                                {user.role === "GGC" &&
                                                                    "Gerente Geral de Cliente"}
                                                                {user.role === "GU" &&
                                                                    "Gerente de Unidade"}
                                                                {user.role === "C" && "Comercial"}
                                                            </span>
                                                            : {user.name}
                                                        </div>
                                                    ))}
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
                                            <Button
                                                variant="primary"
                                                onClick={() => handleViewProposals(client.cnpj)}
                                                className="flex items-center gap-2 px-2 py-1 text-xs"
                                            >
                                                <FileText size={16} />
                                                Propostas
                                            </Button>
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
                                <Typography element="p" size="sm" className="text-gray-secondary">
                                    {totalClientsCount > 0 && (
                                        <>
                                            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                                            {Math.min(
                                                currentPage * ITEMS_PER_PAGE,
                                                totalClientsCount
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
        </main>
    );
}

export default SearchClientPage;
