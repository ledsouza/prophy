"use client";

import { TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { FileText, Info, Warning } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { mask as cnpjMask } from "validation-br/dist/cnpj";

import { SelectData } from "@/components/forms/Select";
import { ITEMS_PER_PAGE } from "@/constants/pagination";
import { usePendingOperations } from "@/hooks";
import { ClientDTO } from "@/redux/features/clientApiSlice";
import { EquipmentDTO, useGetManufacturersQuery } from "@/redux/features/equipmentApiSlice";
import { ModalityDTO, useListModalitiesQuery } from "@/redux/features/modalityApiSlice";

import { Button, ErrorDisplay, Pagination, Spinner, Tab, Table } from "@/components/common";
import { Input, Select } from "@/components/forms";
import { Typography } from "@/components/foundation";

import { CONTRACT_TYPE_OPTIONS, OPERATION_STATUS_OPTIONS, USER_ROLE_OPTIONS } from "./constants";
import { SearchTab } from "./enums";
import { useSearchQueries } from "./hooks";
import {
    getContractTypeFromOptionId,
    getOperationStatusFromOptionId,
    getUserRoleFromOptionId,
    resetPageState,
    restoreManufacturerFilterState,
    restoreModalityFilterState,
    restorePageState,
    restoreSelectFilterStates,
    restoreTabState,
    restoreTextFilterStates,
} from "./state";
import { ClientFilters, EquipmentFilters } from "./types";
import { buildUrlParams } from "./url";

function SearchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const { hasPendingOperations, isLoading: isPendingLoading } = usePendingOperations();

    const [selectedTabIndex, setSelectedTabIndex] = useState(SearchTab.CLIENTS);

    // Client state
    const [clientCurrentPage, setClientCurrentPage] = useState(1);
    const [clientAppliedFilters, setClientAppliedFilters] = useState<ClientFilters>({
        name: "",
        cnpj: "",
        city: "",
        user_role: "",
        contract_type: "",
        operation_status: "",
    });

    const [selectedClientName, setSelectedClientName] = useState("");
    const [selectedClientCNPJ, setSelectedClientCNPJ] = useState("");
    const [selectedClientCity, setSelectedClientCity] = useState("");
    const [selectedUserRole, setSelectedUserRole] = useState<SelectData>({ id: 0, value: "Todos" });
    const [selectedContractType, setSelectedContractType] = useState<SelectData>({
        id: 0,
        value: "Todos",
    });
    const [selectedOperationStatus, setSelectedOperationStatus] = useState<SelectData>({
        id: 0,
        value: "Todos",
    });

    // Equipment state
    const [equipmentCurrentPage, setEquipmentCurrentPage] = useState(1);
    const [equipmentAppliedFilters, setEquipmentAppliedFilters] = useState<EquipmentFilters>({
        modality: "",
        manufacturer: "",
        client_name: "",
    });

    const [selectedEquipmentModality, setSelectedEquipmentModality] = useState<SelectData>({
        id: 0,
        value: "Todos",
    });
    const [selectedEquipmentManufacturer, setSelectedEquipmentManufacturer] = useState<SelectData>({
        id: 0,
        value: "Todos",
    });
    const [selectedEquipmentClient, setSelectedEquipmentClient] = useState("");

    const {
        clientsData,
        clientsLoading,
        clientsError,
        equipmentsData,
        equipmentsLoading,
        equipmentsError,
    } = useSearchQueries({
        clientCurrentPage,
        clientAppliedFilters,
        equipmentCurrentPage,
        equipmentAppliedFilters,
    });
    const { data: modalitiesData, isLoading: modalitiesLoading } = useListModalitiesQuery();
    const { data: manufacturersData, isLoading: manufacturersLoading } = useGetManufacturersQuery();

    const clients = useMemo(() => clientsData?.results || [], [clientsData?.results]);
    const totalClientsCount = clientsData?.count || 0;

    const equipments = useMemo(() => equipmentsData?.results || [], [equipmentsData?.results]);
    const totalEquipmentsCount = equipmentsData?.count || 0;

    const modalities = useMemo(() => modalitiesData || [], [modalitiesData]);
    const manufacturers = useMemo(
        () => manufacturersData?.manufacturers || [],
        [manufacturersData?.manufacturers]
    );

    const handleTabChange = (index: number) => {
        const params = new URLSearchParams();
        setSelectedTabIndex(index);

        switch (index) {
            case SearchTab.CLIENTS:
                const clientFilters: ClientFilters = {
                    name: selectedClientName,
                    cnpj: selectedClientCNPJ,
                    city: selectedClientCity,
                    user_role: getUserRoleFromOptionId(selectedUserRole.id),
                    contract_type: getContractTypeFromOptionId(selectedContractType.id),
                    operation_status: getOperationStatusFromOptionId(selectedOperationStatus.id),
                };

                buildUrlParams(params, "clients", clientCurrentPage, clientFilters);
                break;

            case SearchTab.EQUIPMENTS:
                const equipmentFilters: EquipmentFilters = {
                    modality: String(selectedEquipmentModality.id),
                    manufacturer: selectedEquipmentManufacturer.value,
                    client_name: selectedEquipmentClient,
                };

                buildUrlParams(params, "equipments", equipmentCurrentPage, equipmentFilters);
                break;

            default:
                break;
        }

        router.push(`?${params.toString()}`);
    };

    const handleClientPageChange = (page: number) => {
        const params = new URLSearchParams();
        setClientCurrentPage(page);

        const clientFilters = {
            name: selectedClientName,
            cnpj: selectedClientCNPJ,
            city: selectedClientCity,
            user_role: getUserRoleFromOptionId(selectedUserRole.id),
            contract_type: getContractTypeFromOptionId(selectedContractType.id),
            operation_status: getOperationStatusFromOptionId(selectedOperationStatus.id),
        };

        buildUrlParams(params, "clients", page, clientFilters);
        router.push(`?${params.toString()}`);
    };

    const handleApplyClientFilters = () => {
        const params = new URLSearchParams();

        resetPageState(clientCurrentPage, setClientCurrentPage);

        const clientFilters = {
            name: selectedClientName,
            cnpj: selectedClientCNPJ,
            city: selectedClientCity,
            user_role: getUserRoleFromOptionId(selectedUserRole.id),
            contract_type: getContractTypeFromOptionId(selectedContractType.id),
            operation_status: getOperationStatusFromOptionId(selectedOperationStatus.id),
        };

        setClientAppliedFilters(clientFilters);

        buildUrlParams(params, "clients", 1, clientFilters);
        router.push(`?${params.toString()}`);
    };

    const handleClearClientFilters = () => {
        const params = new URLSearchParams();

        setSelectedClientName("");
        setSelectedClientCNPJ("");
        setSelectedClientCity("");
        setSelectedUserRole({ id: 0, value: "Todos" });
        setSelectedContractType({ id: 0, value: "Todos" });
        setSelectedOperationStatus({ id: 0, value: "Todos" });

        setClientCurrentPage(1);

        setClientAppliedFilters({
            name: "",
            cnpj: "",
            city: "",
            user_role: "",
            contract_type: "",
            operation_status: "",
        });

        buildUrlParams(params, "clients", 1, {});
        router.push(`?${params.toString()}`);
    };

    const handleApplyEquipmentFilters = () => {
        const params = new URLSearchParams();

        resetPageState(equipmentCurrentPage, setEquipmentCurrentPage);

        const equipmentFilters = {
            modality:
                selectedEquipmentModality.id !== 0 ? selectedEquipmentModality.id.toString() : "",
            manufacturer:
                selectedEquipmentManufacturer.id !== 0 ? selectedEquipmentManufacturer.value : "",
            client_name: selectedEquipmentClient,
        };

        setEquipmentAppliedFilters(equipmentFilters);

        buildUrlParams(params, "equipments", 1, equipmentFilters);
        router.push(`?${params.toString()}`);
    };

    const handleClearEquipmentFilters = () => {
        const params = new URLSearchParams();

        setSelectedEquipmentModality({ id: 0, value: "Todos" });
        setSelectedEquipmentManufacturer({ id: 0, value: "Todos" });
        setSelectedEquipmentClient("");

        setEquipmentCurrentPage(1);

        setEquipmentAppliedFilters({
            modality: "",
            manufacturer: "",
            client_name: "",
        });

        buildUrlParams(params, "equipments", 1, {});
        router.push(`?${params.toString()}`);
    };

    const handleEquipmentPageChange = (page: number) => {
        const params = new URLSearchParams();
        setEquipmentCurrentPage(page);

        const equipmentFilters = {
            modality:
                selectedEquipmentModality.id !== 0 ? selectedEquipmentModality.id.toString() : "",
            manufacturer:
                selectedEquipmentManufacturer.id !== 0 ? selectedEquipmentManufacturer.value : "",
            client_name: selectedEquipmentClient,
        };

        buildUrlParams(params, "equipments", page, equipmentFilters);
        router.push(`?${params.toString()}`);
    };

    const handleViewProposals = (cnpj: string) => {
        router.push(`/dashboard/proposals?cnpj=${cnpj}`);
    };

    const handleViewDetails = (cnpj: string) => {
        router.push(`/dashboard/client/${cnpj}`);
    };

    // restore filters from URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        const clientName = params.get("name") || "";
        const clientCNPJ = params.get("cnpj") || "";
        const clientCity = params.get("city") || "";
        const role = params.get("user_role");
        const clientContractType = params.get("contract_type");
        const operationStatus = params.get("operation_status");

        const clientPageParam = params.get("client_page");
        const tabParam = params.get("tab");

        const equipmentModalityId = params.get("modality");
        const equipmentManufacturer = params.get("manufacturer") || "";
        const equipmentClientName = params.get("client_name") || "";
        const equipmentPageParam = params.get("equipment_page");

        restoreTabState(tabParam, setSelectedTabIndex);

        restorePageState(clientPageParam, clientCurrentPage, setClientCurrentPage);
        restoreTextFilterStates(clientName, setSelectedClientName);
        restoreTextFilterStates(clientCNPJ, setSelectedClientCNPJ);
        restoreTextFilterStates(clientCity, setSelectedClientCity);
        restoreSelectFilterStates(role, USER_ROLE_OPTIONS, setSelectedUserRole);
        restoreSelectFilterStates(
            clientContractType,
            CONTRACT_TYPE_OPTIONS,
            setSelectedContractType
        );
        restoreSelectFilterStates(
            operationStatus,
            OPERATION_STATUS_OPTIONS,
            setSelectedOperationStatus
        );
        setClientAppliedFilters({
            name: clientName,
            cnpj: clientCNPJ,
            city: clientCity,
            user_role: role || "",
            contract_type: clientContractType || "",
            operation_status: operationStatus || "",
        });

        restorePageState(equipmentPageParam, equipmentCurrentPage, setEquipmentCurrentPage);
        setEquipmentAppliedFilters({
            modality: equipmentModalityId || "",
            manufacturer: equipmentManufacturer,
            client_name: equipmentClientName,
        });
        restoreTextFilterStates(equipmentClientName, setSelectedEquipmentClient);
        restoreManufacturerFilterState(
            equipmentManufacturer,
            manufacturers,
            setSelectedEquipmentManufacturer
        );
        restoreModalityFilterState(equipmentModalityId, modalities, setSelectedEquipmentModality);
    }, [searchParams, modalities, manufacturers]);

    if (clientsLoading) {
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
                                    value={selectedClientName}
                                    onChange={(e) => setSelectedClientName(e.target.value)}
                                    placeholder="Digite o nome do cliente"
                                >
                                    Nome
                                </Input>

                                <Input
                                    value={selectedClientCNPJ}
                                    onChange={(e) => setSelectedClientCNPJ(e.target.value)}
                                    placeholder="Digite o CNPJ"
                                >
                                    CNPJ
                                </Input>

                                <Input
                                    value={selectedClientCity}
                                    onChange={(e) => setSelectedClientCity(e.target.value)}
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
                                    onClick={handleApplyClientFilters}
                                    className="flex-1 sm:flex-initial"
                                    disabled={clientsLoading}
                                    data-testid="btn-apply-filters"
                                >
                                    {clientsLoading ? "Carregando..." : "Aplicar Filtros"}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={handleClearClientFilters}
                                    className="flex-1 sm:flex-initial"
                                    disabled={clientsLoading}
                                    data-testid="btn-clear-filters"
                                >
                                    Limpar Filtros
                                </Button>
                            </div>

                            {/* Client Results Section */}
                            <div className="bg-gray-50 rounded-xl p-6">
                                <Typography element="h2" size="title3" className="font-bold mb-4">
                                    Resultados
                                </Typography>

                                {clients.length === 0 && !clientsLoading ? (
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
                                        {!clientsLoading && totalClientsCount > ITEMS_PER_PAGE && (
                                            <div className="mt-6">
                                                <Pagination
                                                    currentPage={clientCurrentPage}
                                                    totalCount={totalClientsCount}
                                                    itemsPerPage={ITEMS_PER_PAGE}
                                                    onPageChange={handleClientPageChange}
                                                    isLoading={clientsLoading}
                                                />
                                            </div>
                                        )}

                                        {/* Results Summary */}
                                        {!clientsLoading && (
                                            <div className="mt-4 text-center">
                                                <Typography
                                                    element="p"
                                                    size="sm"
                                                    className="text-gray-secondary"
                                                >
                                                    {totalClientsCount > 0 && (
                                                        <>
                                                            Mostrando{" "}
                                                            {(clientCurrentPage - 1) *
                                                                ITEMS_PER_PAGE +
                                                                1}
                                                            -
                                                            {Math.min(
                                                                clientCurrentPage * ITEMS_PER_PAGE,
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
                            {/* Equipment Search Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                <Select
                                    options={[
                                        { id: 0, value: "Todos" },
                                        ...modalities.map((modality: ModalityDTO) => ({
                                            id: modality.id,
                                            value: modality.name,
                                        })),
                                    ]}
                                    selectedData={selectedEquipmentModality}
                                    setSelect={setSelectedEquipmentModality}
                                    label="Modalidade"
                                    dataTestId="filter-equipment-modality"
                                />

                                <Select
                                    options={[
                                        { id: 0, value: "Todos" },
                                        ...manufacturers.map(
                                            (manufacturer: string, index: number) => ({
                                                id: index + 1,
                                                value: manufacturer,
                                            })
                                        ),
                                    ]}
                                    selectedData={selectedEquipmentManufacturer}
                                    setSelect={setSelectedEquipmentManufacturer}
                                    label="Fabricante"
                                    dataTestId="filter-equipment-manufacturer"
                                />

                                <Input
                                    value={selectedEquipmentClient}
                                    onChange={(e) => setSelectedEquipmentClient(e.target.value)}
                                    placeholder="Digite o nome do cliente"
                                >
                                    Cliente
                                </Input>
                            </div>

                            {/* Equipment Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                <Button
                                    onClick={handleApplyEquipmentFilters}
                                    className="flex-1 sm:flex-initial"
                                    disabled={equipmentsLoading}
                                    data-testid="btn-apply-equipment-filters"
                                >
                                    {equipmentsLoading ? "Carregando..." : "Aplicar Filtros"}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={handleClearEquipmentFilters}
                                    className="flex-1 sm:flex-initial"
                                    disabled={equipmentsLoading}
                                    data-testid="btn-clear-equipment-filters"
                                >
                                    Limpar Filtros
                                </Button>
                            </div>

                            {/* Equipment Results Section */}
                            <div className="bg-gray-50 rounded-xl p-6">
                                <Typography element="h2" size="title3" className="font-bold mb-4">
                                    Resultados
                                </Typography>

                                {equipments.length === 0 && !equipmentsLoading ? (
                                    <div className="text-center py-8">
                                        <Typography
                                            element="p"
                                            size="lg"
                                            className="text-gray-secondary"
                                        >
                                            Nenhum equipamento encontrado com os filtros aplicados
                                        </Typography>
                                    </div>
                                ) : (
                                    <div>
                                        {equipmentsLoading && (
                                            <div className="flex justify-center py-8">
                                                <Spinner />
                                            </div>
                                        )}

                                        {!equipmentsLoading && (
                                            <Table
                                                data={equipments}
                                                columns={[
                                                    {
                                                        header: "Modelo",
                                                        cell: (equipment: EquipmentDTO) =>
                                                            equipment.model,
                                                    },
                                                    {
                                                        header: "Fabricante",
                                                        cell: (equipment: EquipmentDTO) =>
                                                            equipment.manufacturer,
                                                    },
                                                    {
                                                        header: "Modalidade",
                                                        cell: (equipment: EquipmentDTO) =>
                                                            equipment.modality.name,
                                                    },
                                                    {
                                                        header: "Cliente",
                                                        cell: (equipment: EquipmentDTO) =>
                                                            equipment.client_name,
                                                    },
                                                    {
                                                        header: "Unidade",
                                                        cell: (equipment: EquipmentDTO) =>
                                                            equipment.unit_name,
                                                    },
                                                    {
                                                        header: "Ações",
                                                        cell: (equipment: EquipmentDTO) => (
                                                            <div className="flex flex-col gap-2">
                                                                <Button
                                                                    variant="primary"
                                                                    onClick={() =>
                                                                        router.push(
                                                                            `/dashboard/unit/${
                                                                                equipment.unit
                                                                            }?model=${encodeURIComponent(
                                                                                equipment.model
                                                                            )}`
                                                                        )
                                                                    }
                                                                    className="flex items-center gap-2 text-xs"
                                                                >
                                                                    <Info size={16} />
                                                                    Detalhes
                                                                </Button>
                                                            </div>
                                                        ),
                                                    },
                                                ]}
                                                keyExtractor={(equipment: EquipmentDTO) =>
                                                    equipment.id
                                                }
                                            />
                                        )}

                                        {/* Equipment Pagination */}
                                        {!equipmentsLoading &&
                                            totalEquipmentsCount > ITEMS_PER_PAGE && (
                                                <div className="mt-6">
                                                    <Pagination
                                                        currentPage={equipmentCurrentPage}
                                                        totalCount={totalEquipmentsCount}
                                                        itemsPerPage={ITEMS_PER_PAGE}
                                                        onPageChange={handleEquipmentPageChange}
                                                        isLoading={equipmentsLoading}
                                                    />
                                                </div>
                                            )}

                                        {/* Equipment Results Summary */}
                                        {!equipmentsLoading && (
                                            <div className="mt-4 text-center">
                                                <Typography
                                                    element="p"
                                                    size="sm"
                                                    className="text-gray-secondary"
                                                >
                                                    {totalEquipmentsCount > 0 && (
                                                        <>
                                                            Mostrando{" "}
                                                            {(equipmentCurrentPage - 1) *
                                                                ITEMS_PER_PAGE +
                                                                1}
                                                            -
                                                            {Math.min(
                                                                equipmentCurrentPage *
                                                                    ITEMS_PER_PAGE,
                                                                totalEquipmentsCount
                                                            )}{" "}
                                                            de {totalEquipmentsCount} equipamento(s)
                                                        </>
                                                    )}
                                                    {totalEquipmentsCount === 0 &&
                                                        "Nenhum equipamento encontrado"}
                                                </Typography>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TabPanel>
                    </TabPanels>
                </TabGroup>
            </div>
        </main>
    );
}

export default SearchPage;
