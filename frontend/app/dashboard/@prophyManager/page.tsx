"use client";

import { TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { CheckCircleIcon, WarningIcon, XCircleIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { mask as cnpjMask } from "validation-br/dist/cnpj";

import { SelectData } from "@/components/forms/Select";
import { ITEMS_PER_PAGE } from "@/constants/pagination";
import {
    useFilterApplication,
    useFilterClear,
    useFilterRestoration,
    usePageNavigation,
    usePendingOperations,
    useTabNavigation,
} from "@/hooks";
import { EquipmentDTO, useGetManufacturersQuery } from "@/redux/features/equipmentApiSlice";
import { ModalityDTO, useListModalitiesQuery } from "@/redux/features/modalityApiSlice";
import type { ClientDTO } from "@/types/client";
import { restoreSelectFilterStates, restoreTextFilterStates } from "@/utils/filter-restoration";
import { buildStandardUrlParams } from "@/utils/url-params";

import { AppointmentSearchTab } from "@/components/appointments";
import {
    Button,
    ErrorDisplay,
    Modal,
    Pagination,
    ReportsSearchTab,
    Spinner,
    Tab,
    Table,
} from "@/components/common";
import {
    CreateAppointmentForm,
    CreateClientForm,
    CreateProposalForm,
    EditProposalForm,
    Input,
    Select,
} from "@/components/forms";
import { Typography } from "@/components/foundation";
import { ProposalsSearchSection } from "@/components/proposals/ProposalsSearchSection";
import { useRetrieveUserQuery } from "@/redux/features/authApiSlice";
import { useUpdateClientMutation } from "@/redux/features/clientApiSlice";
import Role from "@/enums/Role";
import { child } from "@/utils/logger";
import { getStatusDisplay } from "@/utils/format";

import { CONTRACT_TYPE_OPTIONS, OPERATION_STATUS_OPTIONS, USER_ROLE_OPTIONS } from "./constants";
import { getTabFromParam, SearchTab } from "./enums";
import { useSearchQueries } from "./hooks";
import {
    getContractTypeFromOptionId,
    getContractTypeOptionIdFromValue,
    getOperationStatusFromOptionId,
    getOperationStatusOptionIdFromValue,
    getUserRoleFromOptionId,
    getUserRoleOptionIdFromValue,
    restoreManufacturerFilterState,
    restoreModalityFilterState,
} from "./state";
import { ClientFilters, EquipmentFilters } from "./types";

import { closeModal, Modals, openModal } from "@/redux/features/modalSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const log = child({ component: "ProphyManagerSearchPage" });

function SearchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const dispatch = useAppDispatch();
    const { isModalOpen, currentModal, selectedProposal, isCloseDisabled } = useAppSelector(
        (state) => state.modal,
    );
    const { data: currentUser } = useRetrieveUserQuery();
    const isProphyManager = currentUser?.role === Role.GP;

    const { hasPendingOperations, isLoading: isPendingLoading } = usePendingOperations();

    const [selectedTabIndex, setSelectedTabIndex] = useState(SearchTab.CLIENTS);
    const [togglingClientId, setTogglingClientId] = useState<number | null>(null);

    const [updateClient, { isLoading: isUpdatingClient }] = useUpdateClientMutation();

    // Client state
    const [clientCurrentPage, setClientCurrentPage] = useState(1);
    const [clientAppliedFilters, setClientAppliedFilters] = useState<ClientFilters>({
        name: "",
        cnpj: "",
        city: "",
        user_role: "",
        responsible_cpf: "",
        contract_type: "",
        operation_status: "",
    });

    const [selectedClientName, setSelectedClientName] = useState("");
    const [selectedClientCNPJ, setSelectedClientCNPJ] = useState("");
    const [selectedClientCity, setSelectedClientCity] = useState("");
    const [selectedResponsibleCpf, setSelectedResponsibleCpf] = useState("");
    const [selectedUserRole, setSelectedUserRole] = useState<SelectData | null>({
        id: 0,
        value: "Todos",
    });
    const [selectedContractType, setSelectedContractType] = useState<SelectData | null>({
        id: 0,
        value: "Todos",
    });
    const [selectedOperationStatus, setSelectedOperationStatus] = useState<SelectData | null>({
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

    const [selectedEquipmentModality, setSelectedEquipmentModality] = useState<SelectData | null>({
        id: 0,
        value: "Todos",
    });
    const [selectedEquipmentManufacturer, setSelectedEquipmentManufacturer] =
        useState<SelectData | null>({
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
        [manufacturersData?.manufacturers],
    );

    const { handleTabChange } = useTabNavigation(setSelectedTabIndex, {
        [SearchTab.CLIENTS]: {
            tabName: "clients",
            pageKey: "client_page",
            currentPage: clientCurrentPage,
            buildFilters: () => ({
                name: selectedClientName,
                cnpj: selectedClientCNPJ,
                city: selectedClientCity,
                user_role: getUserRoleFromOptionId(selectedUserRole?.id ?? 0),
                responsible_cpf: selectedResponsibleCpf,
                contract_type: getContractTypeFromOptionId(selectedContractType?.id ?? 0),
                operation_status: getOperationStatusFromOptionId(selectedOperationStatus?.id ?? 0),
            }),
        },
        [SearchTab.EQUIPMENTS]: {
            tabName: "equipments",
            pageKey: "equipment_page",
            currentPage: equipmentCurrentPage,
            buildFilters: () => ({
                modality: String(selectedEquipmentModality?.id ?? 0),
                manufacturer: selectedEquipmentManufacturer?.value ?? "",
                client_name: selectedEquipmentClient,
            }),
        },
        [SearchTab.APPOINTMENTS]: {
            tabName: "appointments",
            pageKey: "appointments_page",
            currentPage: 1,
            buildFilters: () => ({}),
        },
        [SearchTab.PROPOSALS]: {
            tabName: "proposals",
            pageKey: "proposal_page",
            currentPage: 1,
            buildFilters: () => ({}),
        },
        [SearchTab.REPORTS]: {
            tabName: "reports",
            pageKey: "reports_page",
            currentPage: 1,
            buildFilters: () => ({}),
        },
    });

    const { handlePageChange: handleClientPageChange } = usePageNavigation({
        tabName: "clients",
        pageKey: "client_page",
        buildFilters: () => ({
            name: selectedClientName,
            cnpj: selectedClientCNPJ,
            city: selectedClientCity,
            user_role: getUserRoleFromOptionId(selectedUserRole?.id ?? 0),
            responsible_cpf: selectedResponsibleCpf,
            contract_type: getContractTypeFromOptionId(selectedContractType?.id ?? 0),
            operation_status: getOperationStatusFromOptionId(selectedOperationStatus?.id ?? 0),
        }),
        setCurrentPage: setClientCurrentPage,
    });

    const { handleApplyFilters: handleApplyClientFilters } = useFilterApplication({
        tabName: "clients",
        pageKey: "client_page",
        currentPage: clientCurrentPage,
        setCurrentPage: setClientCurrentPage,
        setAppliedFilters: setClientAppliedFilters,
        buildFilters: () => ({
            name: selectedClientName,
            cnpj: selectedClientCNPJ,
            city: selectedClientCity,
            user_role: getUserRoleFromOptionId(selectedUserRole?.id ?? 0),
            responsible_cpf: selectedResponsibleCpf,
            contract_type: getContractTypeFromOptionId(selectedContractType?.id ?? 0),
            operation_status: getOperationStatusFromOptionId(selectedOperationStatus?.id ?? 0),
        }),
    });

    const { handleClearFilters: handleClearClientFilters } = useFilterClear({
        tabName: "clients",
        pageKey: "client_page",
        setCurrentPage: setClientCurrentPage,
        setAppliedFilters: setClientAppliedFilters,
        resetFilters: () => {
            setSelectedClientName("");
            setSelectedClientCNPJ("");
            setSelectedClientCity("");
            setSelectedResponsibleCpf("");
            setSelectedUserRole({ id: 0, value: "Todos" });
            setSelectedContractType({ id: 0, value: "Todos" });
            setSelectedOperationStatus({ id: 0, value: "Todos" });
        },
        emptyFilters: {
            name: "",
            cnpj: "",
            city: "",
            user_role: "",
            responsible_cpf: "",
            contract_type: "",
            operation_status: "",
        },
    });

    const { handleApplyFilters: handleApplyEquipmentFilters } = useFilterApplication({
        tabName: "equipments",
        pageKey: "equipment_page",
        currentPage: equipmentCurrentPage,
        setCurrentPage: setEquipmentCurrentPage,
        setAppliedFilters: setEquipmentAppliedFilters,
        buildFilters: () => ({
            modality:
                selectedEquipmentModality?.id && selectedEquipmentModality.id !== 0
                    ? selectedEquipmentModality.id.toString()
                    : "",
            manufacturer:
                selectedEquipmentManufacturer?.id && selectedEquipmentManufacturer.id !== 0
                    ? selectedEquipmentManufacturer.value
                    : "",
            client_name: selectedEquipmentClient,
        }),
    });

    const { handleClearFilters: handleClearEquipmentFilters } = useFilterClear({
        tabName: "equipments",
        pageKey: "equipment_page",
        setCurrentPage: setEquipmentCurrentPage,
        setAppliedFilters: setEquipmentAppliedFilters,
        resetFilters: () => {
            setSelectedEquipmentModality({ id: 0, value: "Todos" });
            setSelectedEquipmentManufacturer({ id: 0, value: "Todos" });
            setSelectedEquipmentClient("");
        },
        emptyFilters: {
            modality: "",
            manufacturer: "",
            client_name: "",
        },
    });

    const { handlePageChange: handleEquipmentPageChange } = usePageNavigation({
        tabName: "equipments",
        pageKey: "equipment_page",
        buildFilters: () => ({
            modality:
                selectedEquipmentModality?.id && selectedEquipmentModality.id !== 0
                    ? selectedEquipmentModality.id.toString()
                    : "",
            manufacturer:
                selectedEquipmentManufacturer?.id && selectedEquipmentManufacturer.id !== 0
                    ? selectedEquipmentManufacturer.value
                    : "",
            client_name: selectedEquipmentClient,
        }),
        setCurrentPage: setEquipmentCurrentPage,
    });

    const handleViewProposals = (cnpj: string) => {
        const params = buildStandardUrlParams({
            tabName: "proposals",
            pageKey: "proposal_page",
            page: 1,
            filters: { cnpj },
        });
        router.push(`/dashboard/?${params.toString()}`);
    };

    const handleViewDetails = (cnpj: string) => {
        router.push(`/dashboard/client/${cnpj}`);
    };

    const handleToggleClientStatus = async (client: ClientDTO) => {
        setTogglingClientId(client.id);
        try {
            await updateClient({
                id: client.id,
                is_active: !client.is_active,
            }).unwrap();
        } catch (error) {
            log.error(
                { error: (error as Error)?.message ?? String(error) },
                "Failed to toggle client status",
            );
        } finally {
            setTogglingClientId(null);
        }
    };

    useFilterRestoration({
        searchParams,
        setSelectedTabIndex,
        getTabFromParam,
        tabs: {
            [SearchTab.CLIENTS]: {
                pageParam: "client_page",
                currentPage: clientCurrentPage,
                setCurrentPage: setClientCurrentPage,
                restoreFilters: (params) => {
                    const clientName = params.get("clients_name") || "";
                    const clientCNPJ = params.get("clients_cnpj") || "";
                    const clientCity = params.get("clients_city") || "";
                    const responsibleCpf = params.get("clients_responsible_cpf") || "";
                    const role = params.get("clients_user_role");
                    const clientContractType = params.get("clients_contract_type");
                    const operationStatus = params.get("clients_operation_status");

                    restoreTextFilterStates(clientName, setSelectedClientName);
                    restoreTextFilterStates(clientCNPJ, setSelectedClientCNPJ);
                    restoreTextFilterStates(clientCity, setSelectedClientCity);
                    restoreTextFilterStates(responsibleCpf, setSelectedResponsibleCpf);

                    const roleOptionId = getUserRoleOptionIdFromValue(role);
                    const contractTypeOptionId =
                        getContractTypeOptionIdFromValue(clientContractType);
                    const operationStatusOptionId =
                        getOperationStatusOptionIdFromValue(operationStatus);

                    restoreSelectFilterStates(
                        roleOptionId.toString(),
                        USER_ROLE_OPTIONS,
                        setSelectedUserRole,
                    );
                    restoreSelectFilterStates(
                        contractTypeOptionId.toString(),
                        CONTRACT_TYPE_OPTIONS,
                        setSelectedContractType,
                    );
                    restoreSelectFilterStates(
                        operationStatusOptionId.toString(),
                        OPERATION_STATUS_OPTIONS,
                        setSelectedOperationStatus,
                    );
                },
                setAppliedFilters: setClientAppliedFilters,
                buildAppliedFilters: (params) => ({
                    name: params.get("clients_name") || "",
                    cnpj: params.get("clients_cnpj") || "",
                    city: params.get("clients_city") || "",
                    user_role: params.get("clients_user_role") || "",
                    responsible_cpf: params.get("clients_responsible_cpf") || "",
                    contract_type: params.get("clients_contract_type") || "",
                    operation_status: params.get("clients_operation_status") || "",
                }),
            },
            [SearchTab.EQUIPMENTS]: {
                pageParam: "equipment_page",
                currentPage: equipmentCurrentPage,
                setCurrentPage: setEquipmentCurrentPage,
                restoreFilters: (params) => {
                    const equipmentModalityId = params.get("equipments_modality");
                    const equipmentManufacturer = params.get("equipments_manufacturer") || "";
                    const equipmentClientName = params.get("equipments_client_name") || "";

                    restoreTextFilterStates(equipmentClientName, setSelectedEquipmentClient);
                    restoreManufacturerFilterState(
                        equipmentManufacturer,
                        manufacturers,
                        setSelectedEquipmentManufacturer,
                    );
                    restoreModalityFilterState(
                        equipmentModalityId,
                        modalities,
                        setSelectedEquipmentModality,
                    );
                },
                setAppliedFilters: setEquipmentAppliedFilters,
                buildAppliedFilters: (params) => ({
                    modality: params.get("equipments_modality") || "",
                    manufacturer: params.get("equipments_manufacturer") || "",
                    client_name: params.get("equipments_client_name") || "",
                }),
            },
            [SearchTab.APPOINTMENTS]: {
                pageParam: "appointments_page",
                currentPage: 1,
                setCurrentPage: () => {},
                restoreFilters: () => {},
                setAppliedFilters: () => {},
                buildAppliedFilters: () => ({}),
            },
        },
        dependencies: [modalities, manufacturers],
    });

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
                        <div className="flex-1" data-cy="search-tab-clients">
                            <Tab>Clientes</Tab>
                        </div>
                        <div className="flex-1" data-cy="search-tab-equipments">
                            <Tab>Equipamentos</Tab>
                        </div>
                        <div className="flex-1" data-cy="search-tab-appointments">
                            <Tab>Agendamentos</Tab>
                        </div>
                        <div className="flex-1" data-cy="search-tab-proposals">
                            <Tab>Propostas</Tab>
                        </div>
                        <div className="flex-1" data-cy="search-tab-reports">
                            <Tab>Relatórios</Tab>
                        </div>
                    </TabList>

                    <TabPanels>
                        <TabPanel>
                            {/* Client Search Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                <Input
                                    value={selectedClientName}
                                    onChange={(e) => setSelectedClientName(e.target.value)}
                                    placeholder="Digite o nome do cliente"
                                    label="Nome"
                                    dataCy="clients-filter-name"
                                ></Input>

                                <Input
                                    value={selectedClientCNPJ}
                                    onChange={(e) => setSelectedClientCNPJ(e.target.value)}
                                    placeholder="Digite o CNPJ"
                                    label="CNPJ"
                                    dataCy="clients-filter-cnpj"
                                ></Input>

                                <Input
                                    value={selectedClientCity}
                                    onChange={(e) => setSelectedClientCity(e.target.value)}
                                    placeholder="Digite a cidade"
                                    label="Cidade"
                                    dataCy="clients-filter-city"
                                ></Input>

                                <Input
                                    value={selectedResponsibleCpf}
                                    onChange={(e) =>
                                        setSelectedResponsibleCpf(
                                            e.target.value.replace(/\D/g, "").slice(0, 11),
                                        )
                                    }
                                    placeholder="Digite o CPF"
                                    label="CPF do físico responsável"
                                    dataCy="clients-filter-responsible-cpf"
                                ></Input>

                                <Select
                                    options={USER_ROLE_OPTIONS}
                                    selectedData={selectedUserRole}
                                    setSelect={setSelectedUserRole}
                                    label="Perfil de Usuário"
                                    dataTestId="filter-user-role"
                                    dataCy="clients-filter-user-role"
                                />

                                <Select
                                    options={CONTRACT_TYPE_OPTIONS}
                                    selectedData={selectedContractType}
                                    setSelect={setSelectedContractType}
                                    label="Tipo de Contrato"
                                    dataTestId="filter-contract-type"
                                    dataCy="clients-filter-contract-type"
                                />

                                <Select
                                    options={OPERATION_STATUS_OPTIONS}
                                    selectedData={selectedOperationStatus}
                                    setSelect={setSelectedOperationStatus}
                                    label="Status de Operações"
                                    labelAddon={
                                        hasPendingOperations &&
                                        !isPendingLoading && (
                                            <div className="group relative">
                                                <WarningIcon
                                                    size={16}
                                                    className="text-WarningIcon cursor-help"
                                                    weight="fill"
                                                />
                                                <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform whitespace-nowrap rounded-lg bg-gray-800 px-3 py-2 text-sm text-white opacity-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100 z-10">
                                                    Existem operações pendentes de revisão no
                                                    sistema
                                                    <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 transform border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    dataTestId="filter-operation-status"
                                    dataCy="clients-filter-operation-status"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Button
                                        onClick={handleApplyClientFilters}
                                        className="flex-1 sm:flex-initial"
                                        disabled={clientsLoading}
                                        data-testid="btn-apply-filters"
                                        dataCy="clients-apply-filters"
                                    >
                                        {clientsLoading ? "Carregando..." : "Aplicar Filtros"}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={handleClearClientFilters}
                                        className="flex-1 sm:flex-initial"
                                        disabled={clientsLoading}
                                        data-testid="btn-clear-filters"
                                        dataCy="clients-clear-filters"
                                    >
                                        Limpar Filtros
                                    </Button>
                                </div>
                                {isProphyManager && (
                                    <Button
                                        variant="primary"
                                        onClick={() => dispatch(openModal(Modals.CREATE_CLIENT))}
                                        className="flex-1 sm:flex-initial"
                                        dataCy="btn-create-client"
                                    >
                                        Criar cliente
                                    </Button>
                                )}
                            </div>

                            {/* Client Results Section */}
                            <div className="bg-gray-50 rounded-xl p-6" data-cy="clients-results">
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
                                                        header: "Situação",
                                                        cell: (client: ClientDTO) => {
                                                            const statusInfo = getStatusDisplay(
                                                                client.is_active.toString(),
                                                            );
                                                            return (
                                                                <span
                                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                                                                >
                                                                    {statusInfo.text}
                                                                </span>
                                                            );
                                                        },
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
                                                                        ),
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
                                                                {client.needs_appointment && (
                                                                    <span
                                                                        data-cy={
                                                                            "pending-appointment-badge"
                                                                        }
                                                                        className={clsx(
                                                                            "inline-flex w-full justify-center px-2.5 py-0.5",
                                                                            "rounded-full text-xs font-medium text-center",
                                                                            "bg-red-100 text-red-800 mb-1",
                                                                        )}
                                                                    >
                                                                        Agendamento pendente
                                                                    </span>
                                                                )}

                                                                <Button
                                                                    variant="primary"
                                                                    onClick={() =>
                                                                        handleViewDetails(
                                                                            client.cnpj,
                                                                        )
                                                                    }
                                                                    className="flex items-center gap-2 text-xs"
                                                                    dataCy={`client-details-${client.id}`}
                                                                >
                                                                    Detalhes
                                                                </Button>

                                                                <Button
                                                                    variant="primary"
                                                                    onClick={() =>
                                                                        handleViewProposals(
                                                                            client.cnpj,
                                                                        )
                                                                    }
                                                                    className="flex items-center gap-2 px-2 py-1 text-xs"
                                                                    dataCy={`client-proposals-${client.id}`}
                                                                >
                                                                    Propostas
                                                                </Button>

                                                                <Button
                                                                    variant={
                                                                        client.is_active
                                                                            ? "danger"
                                                                            : "success"
                                                                    }
                                                                    onClick={() =>
                                                                        handleToggleClientStatus(
                                                                            client,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        togglingClientId ===
                                                                            client.id ||
                                                                        isUpdatingClient
                                                                    }
                                                                    className="flex items-center gap-2 text-xs"
                                                                    dataCy={`client-toggle-${client.id}`}
                                                                >
                                                                    {togglingClientId ===
                                                                    client.id ? (
                                                                        <Spinner />
                                                                    ) : client.is_active ? (
                                                                        <>
                                                                            <XCircleIcon
                                                                                size={16}
                                                                            />
                                                                            Desativar
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <CheckCircleIcon
                                                                                size={16}
                                                                            />
                                                                            Ativar
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        ),
                                                    },
                                                ]}
                                                keyExtractor={(client: ClientDTO) => client.id}
                                                rowClassName={(client: ClientDTO) =>
                                                    client.needs_appointment
                                                        ? "bg-red-50 border border-transparent animate-danger"
                                                        : undefined
                                                }
                                                rowProps={(client: ClientDTO) => ({
                                                    "data-cy": `client-row-${client.id}`,
                                                })}
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
                                                                totalClientsCount,
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
                                    disabled={modalitiesLoading}
                                />

                                <Select
                                    options={[
                                        { id: 0, value: "Todos" },
                                        ...manufacturers.map(
                                            (manufacturer: string, index: number) => ({
                                                id: index + 1,
                                                value: manufacturer,
                                            }),
                                        ),
                                    ]}
                                    selectedData={selectedEquipmentManufacturer}
                                    setSelect={setSelectedEquipmentManufacturer}
                                    label="Fabricante"
                                    dataTestId="filter-equipment-manufacturer"
                                    disabled={manufacturersLoading}
                                />

                                <Input
                                    value={selectedEquipmentClient}
                                    onChange={(e) => setSelectedEquipmentClient(e.target.value)}
                                    placeholder="Digite o nome do cliente"
                                    label="Cliente"
                                ></Input>
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
                            <div className="bg-gray-50 rounded-xl p-6" data-cy="equipments-results">
                                <Typography element="h2" size="title3" className="font-bold mb-4">
                                    Resultados
                                </Typography>

                                {equipmentsError && (
                                    <ErrorDisplay
                                        title="Erro ao carregar equipamentos"
                                        message="Ocorreu um erro ao carregar os dados dos equipamentos. Tente novamente mais tarde."
                                    />
                                )}

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
                                                                                equipment.model,
                                                                            )}`,
                                                                        )
                                                                    }
                                                                    className="flex items-center gap-2 text-xs"
                                                                    dataCy={`equipment-details-${
                                                                        equipment.id
                                                                    }`}
                                                                >
                                                                    Detalhes
                                                                </Button>
                                                            </div>
                                                        ),
                                                    },
                                                ]}
                                                keyExtractor={(equipment: EquipmentDTO) =>
                                                    equipment.id
                                                }
                                                rowProps={(equipment: EquipmentDTO) => ({
                                                    "data-cy": `equipment-row-${equipment.id}`,
                                                })}
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
                                                                totalEquipmentsCount,
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

                        <TabPanel>
                            <AppointmentSearchTab
                                canCreate
                                dataCyPrefix="gp-appointments"
                                onOpenCreateAppointment={() =>
                                    dispatch(openModal(Modals.CREATE_APPOINTMENT))
                                }
                            />
                        </TabPanel>

                        <TabPanel>
                            <ProposalsSearchSection />
                        </TabPanel>

                        <TabPanel>
                            <ReportsSearchTab currentUserRole={Role.GP} />
                        </TabPanel>
                    </TabPanels>
                </TabGroup>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    if (!isCloseDisabled) {
                        dispatch(closeModal());
                    }
                }}
                className="max-w-lg"
            >
                {currentModal === Modals.CREATE_CLIENT && (
                    <CreateClientForm
                        title="Criar Cliente"
                        description="Preencha os dados abaixo para criar um novo cliente ativo."
                    />
                )}
                {currentModal === Modals.CREATE_PROPOSAL && (
                    <CreateProposalForm
                        title="Criar Nova Proposta"
                        description="Preencha os dados abaixo para criar uma nova proposta comercial. Todos os campos são obrigatórios."
                    />
                )}
                {currentModal === Modals.EDIT_PROPOSAL && selectedProposal && (
                    <EditProposalForm
                        title="Editar Proposta"
                        description="Atualize os dados da proposta comercial abaixo."
                        proposal={selectedProposal}
                    />
                )}
                {currentModal === Modals.CREATE_APPOINTMENT && (
                    <CreateAppointmentForm
                        title="Novo Agendamento"
                        description="Selecione o cliente e a unidade para criar um novo agendamento."
                    />
                )}
            </Modal>
        </main>
    );
}

export default SearchPage;
