"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { mask as cnpjMask } from "validation-br/dist/cnpj";

import { ClientDTO, useListAllClientsQuery } from "@/redux/features/clientApiSlice";
import { ComboboxDataProps } from "@/components/forms/ComboBox";
import { SelectData } from "@/components/forms/Select";

import { Typography } from "@/components/foundation";
import { ComboBox, Select } from "@/components/forms";
import { Button, Spinner } from "@/components/common";

function SearchClientPage() {
    const { data: clients, isLoading, error } = useListAllClientsQuery();

    // Filter states
    const [selectedName, setSelectedName] = useState<ComboboxDataProps | null>(null);
    const [selectedCnpj, setSelectedCnpj] = useState<ComboboxDataProps | null>(null);
    const [selectedCity, setSelectedCity] = useState<ComboboxDataProps | null>(null);
    const [selectedUserRole, setSelectedUserRole] = useState<SelectData>({ id: 0, value: "Todos" });
    const [selectedContractType, setSelectedContractType] = useState<SelectData>({
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

            // Debug logging to check for duplicates in source data
            if (clients.length !== uniqueClients.length) {
                console.warn(
                    `Source data contains ${
                        clients.length - uniqueClients.length
                    } duplicate clients`
                );
            }

            setFilteredResults(uniqueClients);
            setHasSearched(true);
        }
    }, [clients, hasSearched]);

    // Transform clients data for ComboBox components
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

    // User role options
    const userRoleOptions: SelectData[] = [
        { id: 0, value: "Todos" },
        { id: 1, value: "Físico Médico Interno" },
        { id: 2, value: "Físico Médico Externo" },
        { id: 3, value: "Gerente Prophy" },
        { id: 4, value: "Gerente Geral de Cliente" },
        { id: 5, value: "Gerente de Unidade" },
        { id: 6, value: "Comercial" },
    ];

    // Contract type options
    const contractTypeOptions: SelectData[] = [
        { id: 0, value: "Todos" },
        { id: 1, value: "Anual" },
        { id: 2, value: "Mensal" },
        { id: 3, value: "Semanal" },
    ];

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

        // Remove any potential duplicates based on ID
        const uniqueFiltered = filtered.filter(
            (client, index, self) => index === self.findIndex((c) => c.id === client.id)
        );

        // Debug logging to check for duplicates
        if (filtered.length !== uniqueFiltered.length) {
            console.warn(`Removed ${filtered.length - uniqueFiltered.length} duplicate clients`);
        }

        setFilteredResults(uniqueFiltered);
        setHasSearched(true);
    };

    const handleClearFilters = () => {
        setSelectedName(null);
        setSelectedCnpj(null);
        setSelectedCity(null);
        setSelectedUserRole({ id: 0, value: "Todos" });
        setSelectedContractType({ id: 0, value: "Todos" });
        if (clients) {
            // Remove any potential duplicates when clearing filters
            const uniqueClients = clients.filter(
                (client, index, self) => index === self.findIndex((c) => c.id === client.id)
            );
            setFilteredResults(uniqueClients);
        }
        setHasSearched(true);
    };

    if (isLoading) {
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
                                        E-mail
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                        Cidade
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                        Usuários
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredResults.map((client, clientIndex) => (
                                    <tr
                                        key={`client-row-${clientIndex}-${client.id}`}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {client.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {cnpjMask(client.cnpj)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {client.email}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {client.city}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {client.users.length > 0 ? (
                                                <div className="space-y-1">
                                                    {client.users.map((user, userIndex) => (
                                                        <div
                                                            key={`user-${clientIndex}-${userIndex}-${user.email}`}
                                                            className="text-xs"
                                                        >
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
