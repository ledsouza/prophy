"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { mask as cnpjMask } from "validation-br/dist/cnpj";
import { Warning, FileText } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import {
    ClientDTO,
    ClientOperationDTO,
    useListAllClientsQuery,
    useListAllClientsOperationsQuery,
} from "@/redux/features/clientApiSlice";
import { ProposalDTO, useListAllProposalsQuery } from "@/redux/features/proposalApiSlice";
import {
    UnitDTO,
    UnitOperationDTO,
    useListAllUnitsQuery,
    useListAllUnitsOperationsQuery,
} from "@/redux/features/unitApiSlice";
import {
    EquipmentDTO,
    EquipmentOperationDTO,
    useListAllEquipmentsQuery,
    useListAllEquipmentsOperationsQuery,
} from "@/redux/features/equipmentApiSlice";
import { ComboboxDataProps } from "@/components/forms/ComboBox";
import { SelectData } from "@/components/forms/Select";
import { ContractType, ProposalStatus } from "@/enums";

import { Typography } from "@/components/foundation";
import { ComboBox, Select } from "@/components/forms";
import { Button, Spinner } from "@/components/common";

function SearchClientPage() {
    const router = useRouter();
    const { data: clients, isLoading, error } = useListAllClientsQuery();
    const { data: clientsOperations } = useListAllClientsOperationsQuery();
    const { data: unitsOperations } = useListAllUnitsOperationsQuery();
    const { data: equipmentsOperations } = useListAllEquipmentsOperationsQuery();
    const { data: units } = useListAllUnitsQuery();
    const { data: equipments } = useListAllEquipmentsQuery();
    const { data: proposals, isLoading: proposalsLoading } = useListAllProposalsQuery();

    // Filter states
    const [selectedName, setSelectedName] = useState<ComboboxDataProps | null>(null);
    const [selectedCnpj, setSelectedCnpj] = useState<ComboboxDataProps | null>(null);
    const [selectedCity, setSelectedCity] = useState<ComboboxDataProps | null>(null);
    const [selectedUserRole, setSelectedUserRole] = useState<SelectData>({ id: 0, value: "Todos" });
    const [selectedContractType, setSelectedContractType] = useState<SelectData>({
        id: 0,
        value: "Todos",
    });
    const [selectedOperationStatus, setSelectedOperationStatus] = useState<SelectData>({
        id: 0,
        value: "Todos",
    });

    // Results state
    const [filteredResults, setFilteredResults] = useState<ClientDTO[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    // Initialize results with all clients when data loads
    useEffect(() => {
        if (clients && clients.length > 0 && !hasSearched) {
            // Remove any potential duplicates when initializing
            const uniqueClients = clients.filter(
                (client, index, self) => index === self.findIndex((c) => c.id === client.id)
            );

            setFilteredResults(uniqueClients);
            setHasSearched(true);
        }
    }, [clients, hasSearched]);

    // Transform data for ComboBox components
    const nameOptions = useMemo(() => {
        if (!clients) return [];
        return clients.map((client) => ({
            id: client.id,
            name: client.name,
        }));
    }, [clients]);

    const cnpjOptions = useMemo(() => {
        if (!clients) return [];
        return clients.map((client) => ({
            id: client.id,
            name: client.cnpj,
        }));
    }, [clients]);

    const cityOptions = useMemo(() => {
        if (!clients) return [];
        const uniqueCities = Array.from(new Set(clients.map((client) => client.city)));
        return uniqueCities.map((city, index) => ({
            id: index + 1,
            name: city,
        }));
    }, [clients]);

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

    const getContractTypeFromOptionId = (optionId: number): ContractType | null => {
        switch (optionId) {
            case 1:
                return ContractType.ANNUAL;
            case 2:
                return ContractType.MONTHLY;
            case 3:
                return ContractType.WEEKLY;
            default:
                return null;
        }
    };

    const findMostRecentAcceptedProposal = (
        clientCnpj: string,
        proposals: ProposalDTO[]
    ): ProposalDTO | null => {
        const acceptedProposals = proposals.filter(
            (proposal) =>
                proposal.cnpj === clientCnpj && proposal.status === ProposalStatus.ACCEPTED
        );

        if (acceptedProposals.length === 0) {
            return null;
        }

        // Sort by date (most recent first) and return the first one
        const sorted = acceptedProposals.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return sorted[0];
    };

    // Operation status options
    const operationStatusOptions: SelectData[] = [
        { id: 0, value: "Todos" },
        { id: 1, value: "Com Operações Pendentes" },
        { id: 2, value: "Sem Operações Pendentes" },
    ];

    // Helper function to detect ongoing operations
    const hasOngoingOperations = (
        client: ClientDTO,
        clientOps: ClientOperationDTO[] = [],
        unitOps: UnitOperationDTO[] = [],
        equipmentOps: EquipmentOperationDTO[] = [],
        allUnits: UnitDTO[] = [],
        allEquipments: EquipmentDTO[] = []
    ): boolean => {
        // Check direct client operations with REVIEW status
        const hasClientOps = clientOps.some(
            (op) =>
                op.operation_status === "REV" &&
                (op.original_client === client.id || op.id === client.id)
        );

        // Find client's units and check for unit operations
        const clientUnits = allUnits.filter((unit) => unit.client === client.id);
        const hasUnitOps = unitOps.some(
            (op) =>
                op.operation_status === "REV" &&
                clientUnits.some((unit) => op.original_unit === unit.id || op.id === unit.id)
        );

        // Find client's equipment and check for equipment operations
        const clientEquipments = allEquipments.filter((eq) =>
            clientUnits.some((unit) => eq.unit === unit.id)
        );
        const hasEquipmentOps = equipmentOps.some(
            (op) =>
                op.operation_status === "REV" &&
                clientEquipments.some((eq) => op.original_equipment === eq.id || op.id === eq.id)
        );

        return hasClientOps || hasUnitOps || hasEquipmentOps;
    };

    // Check if there are any ongoing operations across all clients
    const hasAnyOngoingOperations = useMemo(() => {
        if (
            !clients ||
            !clientsOperations ||
            !unitsOperations ||
            !equipmentsOperations ||
            !units ||
            !equipments
        ) {
            return false;
        }

        return clients.some((client) =>
            hasOngoingOperations(
                client,
                clientsOperations,
                unitsOperations,
                equipmentsOperations,
                units,
                equipments
            )
        );
    }, [clients, clientsOperations, unitsOperations, equipmentsOperations, units, equipments]);

    const handleApplyFilters = () => {
        if (!clients) {
            toast.error("Dados dos clientes ainda não foram carregados.");
            return;
        }

        let filtered = [...clients];

        // Filter by name
        if (selectedName) {
            filtered = filtered.filter((client) => client.id === selectedName.id);
        }

        // Filter by CNPJ
        if (selectedCnpj) {
            filtered = filtered.filter((client) => client.id === selectedCnpj.id);
        }

        // Filter by city
        if (selectedCity) {
            filtered = filtered.filter((client) => client.city === selectedCity.name);
        }

        // Filter by user role
        if (selectedUserRole.id !== 0) {
            const roleMap: { [key: string]: string } = {
                "Físico Médico Interno": "FMI",
                "Físico Médico Externo": "FME",
                "Gerente Prophy": "GP",
                "Gerente Geral de Cliente": "GGC",
                "Gerente de Unidade": "GU",
                Comercial: "C",
            };
            const targetRole = roleMap[selectedUserRole.value];
            if (targetRole) {
                filtered = filtered.filter((client) =>
                    client.users.some((user) => user.role === targetRole)
                );
            }
        }

        // Filter by contract type
        if (selectedContractType.id !== 0) {
            const targetContractType = getContractTypeFromOptionId(selectedContractType.id);

            if (targetContractType && proposals) {
                filtered = filtered.filter((client) => {
                    const mostRecentProposal = findMostRecentAcceptedProposal(
                        client.cnpj,
                        proposals
                    );

                    return (
                        mostRecentProposal &&
                        mostRecentProposal.contract_type === targetContractType
                    );
                });
            }
        }

        // Filter by operation status
        if (selectedOperationStatus.id !== 0) {
            if (selectedOperationStatus.id === 1) {
                // Show only clients with ongoing operations
                filtered = filtered.filter((client) =>
                    hasOngoingOperations(
                        client,
                        clientsOperations,
                        unitsOperations,
                        equipmentsOperations,
                        units,
                        equipments
                    )
                );
            } else if (selectedOperationStatus.id === 2) {
                // Show only clients without ongoing operations
                filtered = filtered.filter(
                    (client) =>
                        !hasOngoingOperations(
                            client,
                            clientsOperations,
                            unitsOperations,
                            equipmentsOperations,
                            units,
                            equipments
                        )
                );
            }
        }

        // Remove any potential duplicates based on ID
        const uniqueFiltered = filtered.filter(
            (client, index, self) => index === self.findIndex((c) => c.id === client.id)
        );

        setFilteredResults(uniqueFiltered);
        setHasSearched(true);
    };

    const handleClearFilters = () => {
        setSelectedName(null);
        setSelectedCnpj(null);
        setSelectedCity(null);
        setSelectedUserRole({ id: 0, value: "Todos" });
        setSelectedContractType({ id: 0, value: "Todos" });
        setSelectedOperationStatus({ id: 0, value: "Todos" });
        if (clients) {
            // Remove any potential duplicates when clearing filters
            const uniqueClients = clients.filter(
                (client, index, self) => index === self.findIndex((c) => c.id === client.id)
            );
            setFilteredResults(uniqueClients);
        }
        setHasSearched(true);
    };

    const handleViewProposals = (cnpj: string) => {
        router.push(`/dashboard/proposals?cnpj=${cnpj}`);
    };

    if (isLoading || proposalsLoading) {
        return <Spinner fullscreen />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-8">
                <Typography element="h2" size="title2" className="font-bold text-danger">
                    Erro ao carregar dados
                </Typography>
                <Typography element="p" size="lg">
                    Ocorreu um erro ao carregar os dados dos clientes. Tente novamente mais tarde.
                </Typography>
            </div>
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
                    {/* Nome Filter */}
                    <ComboBox
                        data={nameOptions}
                        selectedValue={selectedName}
                        onChange={setSelectedName}
                        placeholder="Digite o nome do cliente"
                        data-testid="filter-name"
                    >
                        Nome
                    </ComboBox>

                    {/* CNPJ Filter */}
                    <ComboBox
                        data={cnpjOptions}
                        selectedValue={selectedCnpj}
                        onChange={setSelectedCnpj}
                        placeholder="Digite o CNPJ"
                        data-testid="filter-cnpj"
                    >
                        CNPJ
                    </ComboBox>

                    {/* Cidade Filter */}
                    <ComboBox
                        data={cityOptions}
                        selectedValue={selectedCity}
                        onChange={setSelectedCity}
                        placeholder="Digite a cidade"
                        data-testid="filter-city"
                    >
                        Cidade
                    </ComboBox>

                    {/* Perfil de Usuário Filter */}
                    <Select
                        options={userRoleOptions}
                        selectedData={selectedUserRole}
                        setSelect={setSelectedUserRole}
                        label="Perfil de Usuário"
                        dataTestId="filter-user-role"
                    />

                    {/* Tipo de Contrato Filter */}
                    <Select
                        options={contractTypeOptions}
                        selectedData={selectedContractType}
                        setSelect={setSelectedContractType}
                        label="Tipo de Contrato"
                        dataTestId="filter-contract-type"
                    />

                    {/* Status de Operações Filter */}
                    <div className="relative">
                        <div className="flex items-start gap-2">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <label className="block">Status de Operações</label>
                                    {hasAnyOngoingOperations && (
                                        <div className="group relative">
                                            <Warning
                                                size={16}
                                                className="text-amber-500 cursor-help"
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
                        data-testid="btn-apply-filters"
                    >
                        Aplicar Filtros
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleClearFilters}
                        className="flex-1 sm:flex-initial"
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

                {filteredResults.length === 0 && hasSearched ? (
                    <div className="text-center py-8">
                        <Typography element="p" size="lg" className="text-gray-500">
                            Nenhum cliente encontrado com os filtros aplicados
                        </Typography>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                        Nome
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                        CNPJ
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                        Endereço
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                        Usuários
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredResults.map((client, clientIndex) => (
                                    <tr key={clientIndex} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {client.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {cnpjMask(client.cnpj)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {`${client.address} - ${client.state}, ${client.city}`}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {client.users.length > 0 ? (
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
                                                <span className="text-gray-500">
                                                    Nenhum usuário
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            <Button
                                                variant="primary"
                                                onClick={() => handleViewProposals(client.cnpj)}
                                                className="flex items-center gap-2 px-2 py-1 text-xs"
                                            >
                                                <FileText size={16} />
                                                Propostas
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Results Summary */}
                        <div className="mt-4 text-center">
                            <Typography element="p" size="sm" className="text-gray-500">
                                {filteredResults.length} cliente(s) encontrado(s)
                            </Typography>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default SearchClientPage;
