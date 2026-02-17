"use client";

import { TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { FileTextIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { mask as cnpjMask } from "validation-br/dist/cnpj";

import { SelectData } from "@/components/forms/Select";
import { ITEMS_PER_PAGE } from "@/constants/pagination";
import { appointmentStatusLabel } from "@/enums/AppointmentStatus";
import {
    useFilterApplication,
    useFilterClear,
    useFilterRestoration,
    usePageNavigation,
    useTabNavigation,
} from "@/hooks";
import type { AppointmentDTO } from "@/types/appointment";
import type { ClientDTO } from "@/types/client";
import { restoreSelectFilterStates, restoreTextFilterStates } from "@/utils/filter-restoration";
import { child } from "@/utils/logger";
import { buildStandardUrlParams } from "@/utils/url-params";

import {
    Button,
    ErrorDisplay,
    MobileResultCard,
    Modal,
    Pagination,
    Spinner,
    Tab,
    Table,
} from "@/components/common";
import {
    CreateAppointmentForm,
    CreateProposalForm,
    EditProposalForm,
    Input,
    Select,
} from "@/components/forms";
import { Typography } from "@/components/foundation";
import { ProposalsSearchSection } from "@/components/proposals/ProposalsSearchSection";
import { Modals, closeModal, openModal } from "@/redux/features/modalSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

import { useUpdateClientMutation } from "@/redux/features/clientApiSlice";
import { formatDateTime, getStatusDisplay } from "@/utils/format";
import {
    APPOINTMENT_STATUS_OPTIONS,
    CLIENT_STATUS_OPTIONS,
    CONTRACT_TYPE_OPTIONS,
    PROPOSAL_STATUS_OPTIONS,
} from "./constants";
import { SearchTab, getTabFromParam } from "./enums";
import { useSearchQueries } from "./hooks";
import {
    getAppointmentStatusClasses,
    getAppointmentStatusFromOptionId,
    getAppointmentStatusOptionIdFromValue,
    getClientStatusFromOptionId,
    getClientStatusOptionIdFromValue,
    getContractTypeFromOptionId,
    getContractTypeOptionIdFromValue,
    getProposalStatusFromOptionId,
    getProposalStatusOptionIdFromValue,
} from "./state";
import { AppointmentFilters, ClientFilters, ProposalFilters } from "./types";

const log = child({ component: "CommercialSearchPage" });

function SearchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();

    const { isModalOpen, currentModal, selectedProposal } = useAppSelector((state) => state.modal);

    const [selectedTabIndex, setSelectedTabIndex] = useState(SearchTab.CLIENTS);
    const [togglingClientId, setTogglingClientId] = useState<number | null>(null);

    const [updateClient, { isLoading: isUpdatingClient }] = useUpdateClientMutation();

    // Client state
    const [clientCurrentPage, setClientCurrentPage] = useState(1);
    const [clientAppliedFilters, setClientAppliedFilters] = useState<ClientFilters>({
        name: "",
        cnpj: "",
        city: "",
        contract_type: "",
        is_active: "",
    });

    const [selectedClientName, setSelectedClientName] = useState("");
    const [selectedClientCNPJ, setSelectedClientCNPJ] = useState("");
    const [selectedClientCity, setSelectedClientCity] = useState("");
    const [selectedClientStatus, setSelectedClientStatus] = useState<SelectData | null>({
        id: 0,
        value: "Todos",
    });
    const [selectedClientContractType, setSelectedClientContractType] = useState<SelectData | null>(
        {
            id: 0,
            value: "Todos",
        },
    );

    // Proposal state
    const [proposalCurrentPage, setProposalCurrentPage] = useState(1);
    const [proposalAppliedFilters, setProposalAppliedFilters] = useState<ProposalFilters>({
        cnpj: "",
        contact_name: "",
        contract_type: "",
        status: "",
        expiring_annual: "",
    });

    const [selectedProposalCNPJ, setSelectedProposalCNPJ] = useState("");
    const [selectedProposalContactName, setSelectedProposalContactName] = useState("");
    const [selectedProposalContractType, setSelectedProposalContractType] =
        useState<SelectData | null>({
            id: 0,
            value: "Todos",
        });
    const [selectedProposalStatus, setSelectedProposalStatus] = useState<SelectData | null>({
        id: 0,
        value: "Todos",
    });
    const [selectedProposalExpiringAnnual, setSelectedProposalExpiringAnnual] = useState(false);

    // Appointment state
    const [appointmentsCurrentPage, setAppointmentsCurrentPage] = useState(1);
    const [appointmentsAppliedFilters, setAppointmentsAppliedFilters] =
        useState<AppointmentFilters>({
            date_start: "",
            date_end: "",
            status: "",
            client_name: "",
            unit_city: "",
            unit_name: "",
        });

    const [selectedAppointmentDateStart, setSelectedAppointmentDateStart] = useState("");
    const [selectedAppointmentDateEnd, setSelectedAppointmentDateEnd] = useState("");
    const [selectedAppointmentStatus, setSelectedAppointmentStatus] = useState<SelectData | null>({
        id: 0,
        value: "Todos",
    });
    const [selectedAppointmentClientName, setSelectedAppointmentClientName] = useState("");
    const [selectedAppointmentUnitCity, setSelectedAppointmentUnitCity] = useState("");
    const [selectedAppointmentUnitName, setSelectedAppointmentUnitName] = useState("");

    const {
        clientsData,
        clientsLoading,
        clientsError,
        proposalsData,
        proposalsLoading,
        proposalsError,
        appointmentsData,
        appointmentsLoading,
        appointmentsError,
    } = useSearchQueries({
        clientCurrentPage,
        clientAppliedFilters,
        proposalCurrentPage,
        proposalAppliedFilters,
        appointmentsCurrentPage,
        appointmentsAppliedFilters,
    });

    const clients = useMemo(() => clientsData?.results || [], [clientsData?.results]);
    const totalClientsCount = clientsData?.count || 0;

    const proposals = useMemo(() => proposalsData?.results || [], [proposalsData?.results]);
    const totalProposalsCount = proposalsData?.count || 0;

    const appointments = useMemo(
        () => appointmentsData?.results || [],
        [appointmentsData?.results],
    );
    const totalAppointmentsCount = appointmentsData?.count || 0;

    const { handleTabChange } = useTabNavigation(setSelectedTabIndex, {
        [SearchTab.CLIENTS]: {
            tabName: "clients",
            pageKey: "client_page",
            currentPage: clientCurrentPage,
            buildFilters: () => ({
                name: selectedClientName,
                cnpj: selectedClientCNPJ,
                city: selectedClientCity,
                contract_type: getContractTypeFromOptionId(selectedClientContractType?.id ?? 0),
                is_active: getClientStatusFromOptionId(selectedClientStatus?.id ?? 0),
            }),
        },
        [SearchTab.PROPOSALS]: {
            tabName: "proposals",
            pageKey: "proposal_page",
            currentPage: proposalCurrentPage,
            buildFilters: () => ({
                cnpj: selectedProposalCNPJ,
                contact_name: selectedProposalContactName,
                contract_type: getContractTypeFromOptionId(selectedProposalContractType?.id ?? 0),
                status: getProposalStatusFromOptionId(selectedProposalStatus?.id ?? 0),
                expiring_annual: selectedProposalExpiringAnnual ? "true" : "",
            }),
        },
        [SearchTab.APPOINTMENTS]: {
            tabName: "appointments",
            pageKey: "appointments_page",
            currentPage: appointmentsCurrentPage,
            buildFilters: () => ({
                date_start: selectedAppointmentDateStart,
                date_end: selectedAppointmentDateEnd,
                status: getAppointmentStatusFromOptionId(selectedAppointmentStatus?.id ?? 0),
                client_name: selectedAppointmentClientName,
                unit_city: selectedAppointmentUnitCity,
                unit_name: selectedAppointmentUnitName,
            }),
        },
    });

    const { handlePageChange: handleClientPageChange } = usePageNavigation({
        tabName: "clients",
        pageKey: "client_page",
        buildFilters: () => ({
            name: selectedClientName,
            cnpj: selectedClientCNPJ,
            city: selectedClientCity,
            contract_type: getContractTypeFromOptionId(selectedClientContractType?.id ?? 0),
            is_active: getClientStatusFromOptionId(selectedClientStatus?.id ?? 0),
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
            contract_type: getContractTypeFromOptionId(selectedClientContractType?.id ?? 0),
            is_active: getClientStatusFromOptionId(selectedClientStatus?.id ?? 0),
        }),
    });

    const { handleClearFilters: handleClearClientFilters } = useFilterClear<ClientFilters>({
        tabName: "clients",
        pageKey: "client_page",
        setCurrentPage: setClientCurrentPage,
        setAppliedFilters: setClientAppliedFilters,
        resetFilters: () => {
            setSelectedClientName("");
            setSelectedClientCNPJ("");
            setSelectedClientCity("");
            setSelectedClientStatus({ id: 0, value: "Todos" });
            setSelectedClientContractType({ id: 0, value: "Todos" });
        },
        emptyFilters: {
            name: "",
            cnpj: "",
            city: "",
            contract_type: "",
            is_active: "",
        },
    });

    const { handlePageChange: handleProposalPageChange } = usePageNavigation({
        tabName: "proposals",
        pageKey: "proposal_page",
        buildFilters: () => ({
            cnpj: selectedProposalCNPJ,
            contact_name: selectedProposalContactName,
            contract_type: getContractTypeFromOptionId(selectedProposalContractType?.id ?? 0),
            status: getProposalStatusFromOptionId(selectedProposalStatus?.id ?? 0),
            expiring_annual: selectedProposalExpiringAnnual ? "true" : "",
        }),
        setCurrentPage: setProposalCurrentPage,
    });

    const { handleApplyFilters: handleApplyProposalFilters } = useFilterApplication({
        tabName: "proposals",
        pageKey: "proposal_page",
        currentPage: proposalCurrentPage,
        setCurrentPage: setProposalCurrentPage,
        setAppliedFilters: setProposalAppliedFilters,
        buildFilters: () => ({
            cnpj: selectedProposalCNPJ,
            contact_name: selectedProposalContactName,
            contract_type: getContractTypeFromOptionId(selectedProposalContractType?.id ?? 0),
            status: getProposalStatusFromOptionId(selectedProposalStatus?.id ?? 0),
            expiring_annual: selectedProposalExpiringAnnual ? "true" : "",
        }),
    });

    const { handleClearFilters: handleClearProposalFilters } = useFilterClear<ProposalFilters>({
        tabName: "proposals",
        pageKey: "proposal_page",
        setCurrentPage: setProposalCurrentPage,
        setAppliedFilters: setProposalAppliedFilters,
        resetFilters: () => {
            setSelectedProposalCNPJ("");
            setSelectedProposalContactName("");
            setSelectedProposalContractType({ id: 0, value: "Todos" });
            setSelectedProposalStatus({ id: 0, value: "Todos" });
            setSelectedProposalExpiringAnnual(false);
        },
        emptyFilters: {
            cnpj: "",
            contact_name: "",
            contract_type: "",
            status: "",
            expiring_annual: "",
        },
    });

    const { handlePageChange: handleAppointmentPageChange } = usePageNavigation({
        tabName: "appointments",
        pageKey: "appointments_page",
        buildFilters: () => ({
            date_start: selectedAppointmentDateStart,
            date_end: selectedAppointmentDateEnd,
            status: getAppointmentStatusFromOptionId(selectedAppointmentStatus?.id ?? 0),
            client_name: selectedAppointmentClientName,
            unit_city: selectedAppointmentUnitCity,
            unit_name: selectedAppointmentUnitName,
        }),
        setCurrentPage: setAppointmentsCurrentPage,
    });

    const { handleApplyFilters: handleApplyAppointmentFilters } = useFilterApplication({
        tabName: "appointments",
        pageKey: "appointments_page",
        currentPage: appointmentsCurrentPage,
        setCurrentPage: setAppointmentsCurrentPage,
        setAppliedFilters: setAppointmentsAppliedFilters,
        buildFilters: () => ({
            date_start: selectedAppointmentDateStart,
            date_end: selectedAppointmentDateEnd,
            status: getAppointmentStatusFromOptionId(selectedAppointmentStatus?.id ?? 0),
            client_name: selectedAppointmentClientName,
            unit_city: selectedAppointmentUnitCity,
            unit_name: selectedAppointmentUnitName,
        }),
    });

    const { handleClearFilters: handleClearAppointmentFilters } =
        useFilterClear<AppointmentFilters>({
            tabName: "appointments",
            pageKey: "appointments_page",
            setCurrentPage: setAppointmentsCurrentPage,
            setAppliedFilters: setAppointmentsAppliedFilters,
            resetFilters: () => {
                setSelectedAppointmentDateStart("");
                setSelectedAppointmentDateEnd("");
                setSelectedAppointmentStatus({ id: 0, value: "Todos" });
                setSelectedAppointmentClientName("");
                setSelectedAppointmentUnitCity("");
                setSelectedAppointmentUnitName("");
            },
            emptyFilters: {
                date_start: "",
                date_end: "",
                status: "",
                client_name: "",
                unit_city: "",
                unit_name: "",
            },
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

    const handleViewUnitDetails = (unitId: number) => {
        router.push(`/dashboard/unit/${unitId}?tab=appointments`);
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
                    const clientContractType = params.get("clients_contract_type");
                    const clientStatus = params.get("clients_is_active");

                    restoreTextFilterStates(clientName, setSelectedClientName);
                    restoreTextFilterStates(clientCNPJ, setSelectedClientCNPJ);
                    restoreTextFilterStates(clientCity, setSelectedClientCity);

                    const contractTypeOptionId =
                        getContractTypeOptionIdFromValue(clientContractType);
                    const clientStatusOptionId = getClientStatusOptionIdFromValue(clientStatus);

                    restoreSelectFilterStates(
                        contractTypeOptionId.toString(),
                        CONTRACT_TYPE_OPTIONS,
                        setSelectedClientContractType,
                    );
                    restoreSelectFilterStates(
                        clientStatusOptionId.toString(),
                        CLIENT_STATUS_OPTIONS,
                        setSelectedClientStatus,
                    );
                },
                setAppliedFilters: setClientAppliedFilters,
                buildAppliedFilters: (params) => ({
                    name: params.get("clients_name") || "",
                    cnpj: params.get("clients_cnpj") || "",
                    city: params.get("clients_city") || "",
                    contract_type: params.get("clients_contract_type") || "",
                    is_active: params.get("clients_is_active") || "",
                }),
            },
            [SearchTab.PROPOSALS]: {
                pageParam: "proposal_page",
                currentPage: proposalCurrentPage,
                setCurrentPage: setProposalCurrentPage,
                restoreFilters: (params) => {
                    const proposalCNPJ = params.get("proposals_cnpj") || "";
                    const proposalContactName = params.get("proposals_contact_name") || "";
                    const proposalContractType = params.get("proposals_contract_type");
                    const proposalStatus = params.get("proposals_status");
                    const proposalExpiringAnnual = params.get("proposals_expiring_annual") || "";

                    restoreTextFilterStates(proposalCNPJ, setSelectedProposalCNPJ);
                    restoreTextFilterStates(proposalContactName, setSelectedProposalContactName);

                    const contractTypeOptionId =
                        getContractTypeOptionIdFromValue(proposalContractType);
                    const proposalStatusOptionId =
                        getProposalStatusOptionIdFromValue(proposalStatus);

                    restoreSelectFilterStates(
                        contractTypeOptionId.toString(),
                        CONTRACT_TYPE_OPTIONS,
                        setSelectedProposalContractType,
                    );
                    restoreSelectFilterStates(
                        proposalStatusOptionId.toString(),
                        PROPOSAL_STATUS_OPTIONS,
                        setSelectedProposalStatus,
                    );

                    setSelectedProposalExpiringAnnual(proposalExpiringAnnual === "true");
                },
                setAppliedFilters: setProposalAppliedFilters,
                buildAppliedFilters: (params) => ({
                    cnpj: params.get("proposals_cnpj") || "",
                    contact_name: params.get("proposals_contact_name") || "",
                    contract_type: params.get("proposals_contract_type") || "",
                    status: params.get("proposals_status") || "",
                    expiring_annual: params.get("proposals_expiring_annual") || "",
                }),
            },
            [SearchTab.APPOINTMENTS]: {
                pageParam: "appointments_page",
                currentPage: appointmentsCurrentPage,
                setCurrentPage: setAppointmentsCurrentPage,
                restoreFilters: (params) => {
                    const dateStart = params.get("appointments_date_start") || "";
                    const dateEnd = params.get("appointments_date_end") || "";
                    const appointmentStatus = params.get("appointments_status");
                    const clientName = params.get("appointments_client_name") || "";
                    const unitCity = params.get("appointments_unit_city") || "";
                    const unitName = params.get("appointments_unit_name") || "";

                    restoreTextFilterStates(dateStart, setSelectedAppointmentDateStart);
                    restoreTextFilterStates(dateEnd, setSelectedAppointmentDateEnd);
                    restoreTextFilterStates(clientName, setSelectedAppointmentClientName);
                    restoreTextFilterStates(unitCity, setSelectedAppointmentUnitCity);
                    restoreTextFilterStates(unitName, setSelectedAppointmentUnitName);

                    const appointmentStatusOptionId =
                        getAppointmentStatusOptionIdFromValue(appointmentStatus);

                    restoreSelectFilterStates(
                        appointmentStatusOptionId.toString(),
                        APPOINTMENT_STATUS_OPTIONS,
                        setSelectedAppointmentStatus,
                    );
                },
                setAppliedFilters: setAppointmentsAppliedFilters,
                buildAppliedFilters: (params) => ({
                    date_start: params.get("appointments_date_start") || "",
                    date_end: params.get("appointments_date_end") || "",
                    status: params.get("appointments_status") || "",
                    client_name: params.get("appointments_client_name") || "",
                    unit_city: params.get("appointments_unit_city") || "",
                    unit_name: params.get("appointments_unit_name") || "",
                }),
            },
        },
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
                    <TabList
                        className={clsx(
                            "flex gap-2 overflow-x-auto rounded-xl bg-gray-100 p-1 mb-6",
                            "flex-nowrap",
                            "sm:overflow-visible sm:gap-1 sm:space-x-1",
                        )}
                    >
                        <div className="flex-none sm:flex-1" data-cy="commercial-tab-clients">
                            <Tab>Clientes</Tab>
                        </div>
                        <div className="flex-none sm:flex-1" data-cy="commercial-tab-proposals">
                            <Tab>Propostas</Tab>
                        </div>
                        <div className="flex-none sm:flex-1" data-cy="commercial-tab-appointments">
                            <Tab>Agendamentos</Tab>
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
                                ></Input>

                                <Input
                                    value={selectedClientCNPJ}
                                    onChange={(e) => setSelectedClientCNPJ(e.target.value)}
                                    placeholder="Digite o CNPJ"
                                    label="CNPJ"
                                ></Input>

                                <Input
                                    value={selectedClientCity}
                                    onChange={(e) => setSelectedClientCity(e.target.value)}
                                    placeholder="Digite a cidade"
                                    label="Cidade"
                                ></Input>

                                <Select
                                    options={CONTRACT_TYPE_OPTIONS}
                                    selectedData={selectedClientContractType}
                                    setSelect={setSelectedClientContractType}
                                    label="Tipo de Contrato"
                                    dataTestId="filter-contract-type"
                                />

                                <Select
                                    options={CLIENT_STATUS_OPTIONS}
                                    selectedData={selectedClientStatus}
                                    setSelect={setSelectedClientStatus}
                                    label="Situação"
                                    dataTestId="filter-client-status"
                                />
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
                            <div className="results-panel p-6" data-cy="commercial-clients-results">
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
                                                        width: "140px",
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
                                                        header: "Ações",
                                                        cell: (client: ClientDTO) => (
                                                            <div className="flex flex-col gap-2">
                                                                {client.needs_appointment && (
                                                                    <span
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
                                                                >
                                                                    <FileTextIcon size={16} />
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
                                                                        client.id
                                                                    }
                                                                    className="flex items-center gap-2 text-xs"
                                                                    data-testid={`toggle-client-${client.id}`}
                                                                    dataCy={`commercial-toggle-client-${client.id}`}
                                                                >
                                                                    {togglingClientId ===
                                                                    client.id ? (
                                                                        <Spinner />
                                                                    ) : client.is_active ? (
                                                                        <>Desativar</>
                                                                    ) : (
                                                                        <>Ativar</>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        ),
                                                    },
                                                ]}
                                                keyExtractor={(client: ClientDTO) => client.id}
                                                mobileCardRenderer={(client: ClientDTO) => (
                                                    <MobileResultCard
                                                        dataCy={`commercial-client-card-${client.id}`}
                                                        title={client.name}
                                                        badge={(() => {
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
                                                        })()}
                                                        className={clsx(
                                                            client.needs_appointment
                                                                ? "bg-red-50 border-red-100"
                                                                : undefined,
                                                        )}
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
                                                            <div className="flex flex-col gap-2">
                                                                {client.needs_appointment && (
                                                                    <span
                                                                        className={clsx(
                                                                            "inline-flex w-full justify-center px-2.5 py-0.5",
                                                                            "rounded-full text-xs font-medium text-center",
                                                                            "bg-red-100 text-red-800",
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
                                                                >
                                                                    <FileTextIcon size={16} />
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
                                                                        client.id
                                                                    }
                                                                    className="flex items-center gap-2 text-xs"
                                                                    data-testid={`toggle-client-${client.id}`}
                                                                    dataCy={`commercial-toggle-client-${client.id}`}
                                                                >
                                                                    {togglingClientId ===
                                                                    client.id ? (
                                                                        <Spinner />
                                                                    ) : client.is_active ? (
                                                                        <>Desativar</>
                                                                    ) : (
                                                                        <>Ativar</>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        }
                                                    />
                                                )}
                                                rowClassName={(client: ClientDTO) =>
                                                    client.needs_appointment
                                                        ? "bg-red-50 border border-transparent animate-danger"
                                                        : undefined
                                                }
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
                            <ProposalsSearchSection />
                        </TabPanel>

                        <TabPanel>
                            {/* Appointment Search Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                <Input
                                    type="date"
                                    value={selectedAppointmentDateStart}
                                    onChange={(e) =>
                                        setSelectedAppointmentDateStart(e.target.value)
                                    }
                                    label="Data Início"
                                />

                                <Input
                                    type="date"
                                    value={selectedAppointmentDateEnd}
                                    onChange={(e) => setSelectedAppointmentDateEnd(e.target.value)}
                                    label="Data Fim"
                                />

                                <Select
                                    options={APPOINTMENT_STATUS_OPTIONS}
                                    selectedData={selectedAppointmentStatus}
                                    setSelect={setSelectedAppointmentStatus}
                                    label="Situação"
                                    dataTestId="filter-appointment-status"
                                />

                                <Input
                                    value={selectedAppointmentClientName}
                                    onChange={(e) =>
                                        setSelectedAppointmentClientName(e.target.value)
                                    }
                                    placeholder="Digite o nome do cliente"
                                    label="Nome do Cliente"
                                />

                                <Input
                                    value={selectedAppointmentUnitCity}
                                    onChange={(e) => setSelectedAppointmentUnitCity(e.target.value)}
                                    placeholder="Digite a cidade da unidade"
                                    label="Cidade da Unidade"
                                />

                                <Input
                                    value={selectedAppointmentUnitName}
                                    onChange={(e) => setSelectedAppointmentUnitName(e.target.value)}
                                    placeholder="Digite o nome da unidade"
                                    label="Nome da Unidade"
                                />
                            </div>

                            {/* Appointment Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                <Button
                                    onClick={handleApplyAppointmentFilters}
                                    className="flex-1 sm:flex-initial"
                                    disabled={appointmentsLoading}
                                    data-testid="btn-apply-appointment-filters"
                                >
                                    {appointmentsLoading ? "Carregando..." : "Aplicar Filtros"}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={handleClearAppointmentFilters}
                                    className="flex-1 sm:flex-initial"
                                    disabled={appointmentsLoading}
                                    data-testid="btn-clear-appointment-filters"
                                >
                                    Limpar Filtros
                                </Button>
                                <Button
                                    onClick={() => dispatch(openModal(Modals.CREATE_APPOINTMENT))}
                                    className="flex-1 sm:flex-initial ml-auto"
                                    data-testid="btn-create-appointment"
                                >
                                    Novo Agendamento
                                </Button>
                            </div>

                            {/* Appointment Results Section */}
                            <div
                                className="results-panel p-6"
                                data-cy="commercial-appointments-results"
                            >
                                <Typography element="h2" size="title3" className="font-bold mb-4">
                                    Resultados
                                </Typography>

                                {appointmentsError && (
                                    <ErrorDisplay
                                        title="Erro ao carregar agendamentos"
                                        message="Ocorreu um erro ao carregar os dados dos agendamentos. Tente novamente mais tarde."
                                    />
                                )}

                                {appointments.length === 0 && !appointmentsLoading ? (
                                    <div className="text-center py-8">
                                        <Typography
                                            element="p"
                                            size="lg"
                                            className="text-gray-secondary"
                                        >
                                            Nenhum agendamento encontrado com os filtros aplicados
                                        </Typography>
                                    </div>
                                ) : (
                                    <div>
                                        {appointmentsLoading && (
                                            <div className="flex justify-center py-8">
                                                <Spinner />
                                            </div>
                                        )}

                                        {!appointmentsLoading && (
                                            <Table
                                                data={appointments}
                                                columns={[
                                                    {
                                                        header: "Data/Hora",
                                                        cell: (appointment: AppointmentDTO) =>
                                                            formatDateTime(appointment.date),
                                                        width: "160px",
                                                    },
                                                    {
                                                        header: "Cliente",
                                                        cell: (appointment: AppointmentDTO) =>
                                                            appointment.client_name || "N/A",
                                                    },
                                                    {
                                                        header: "Unidade",
                                                        cell: (appointment: AppointmentDTO) =>
                                                            appointment.unit_name || "N/A",
                                                    },
                                                    {
                                                        header: "Endereço",
                                                        cell: (appointment: AppointmentDTO) =>
                                                            appointment.unit_full_address || "N/A",
                                                    },
                                                    {
                                                        header: "Modalidade",
                                                        cell: (appointment: AppointmentDTO) =>
                                                            appointment.type_display || "N/A",
                                                    },
                                                    {
                                                        header: "Situação",
                                                        cell: (appointment: AppointmentDTO) => {
                                                            const statusClasses =
                                                                getAppointmentStatusClasses(
                                                                    appointment.status,
                                                                );
                                                            return (
                                                                <span
                                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses}`}
                                                                >
                                                                    {
                                                                        appointmentStatusLabel[
                                                                            appointment.status
                                                                        ]
                                                                    }
                                                                </span>
                                                            );
                                                        },
                                                        width: "100px",
                                                    },
                                                    {
                                                        header: "Ações",
                                                        cell: (appointment: AppointmentDTO) => (
                                                            <div className="flex flex-col gap-2">
                                                                <Button
                                                                    variant="primary"
                                                                    onClick={() =>
                                                                        handleViewUnitDetails(
                                                                            appointment.unit,
                                                                        )
                                                                    }
                                                                    className="flex items-center gap-2 text-xs"
                                                                    data-testid={`view-unit-${appointment.id}`}
                                                                >
                                                                    Detalhes
                                                                </Button>
                                                            </div>
                                                        ),
                                                    },
                                                ]}
                                                keyExtractor={(appointment: AppointmentDTO) =>
                                                    appointment.id
                                                }
                                                mobileCardRenderer={(
                                                    appointment: AppointmentDTO,
                                                ) => {
                                                    const statusClasses =
                                                        getAppointmentStatusClasses(
                                                            appointment.status,
                                                        );
                                                    return (
                                                        <MobileResultCard
                                                            dataCy={`commercial-appointment-card-${appointment.id}`}
                                                            title={
                                                                appointment.client_name || "Cliente"
                                                            }
                                                            badge={
                                                                <span
                                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses}`}
                                                                >
                                                                    {
                                                                        appointmentStatusLabel[
                                                                            appointment.status
                                                                        ]
                                                                    }
                                                                </span>
                                                            }
                                                            fields={[
                                                                {
                                                                    label: "Data/Hora",
                                                                    value: formatDateTime(
                                                                        appointment.date,
                                                                    ),
                                                                },
                                                                {
                                                                    label: "Cliente",
                                                                    value:
                                                                        appointment.client_name ||
                                                                        "N/A",
                                                                },
                                                                {
                                                                    label: "Unidade",
                                                                    value:
                                                                        appointment.unit_name ||
                                                                        "N/A",
                                                                },
                                                                {
                                                                    label: "Endereço",
                                                                    value:
                                                                        appointment.unit_full_address ||
                                                                        "N/A",
                                                                },
                                                                {
                                                                    label: "Modalidade",
                                                                    value:
                                                                        appointment.type_display ||
                                                                        "N/A",
                                                                },
                                                            ]}
                                                            actions={
                                                                <Button
                                                                    variant="primary"
                                                                    onClick={() =>
                                                                        handleViewUnitDetails(
                                                                            appointment.unit,
                                                                        )
                                                                    }
                                                                    className="flex items-center gap-2 text-xs"
                                                                    data-testid={`view-unit-${appointment.id}`}
                                                                >
                                                                    Detalhes
                                                                </Button>
                                                            }
                                                        />
                                                    );
                                                }}
                                                rowProps={(appointment: AppointmentDTO) => ({
                                                    "data-cy": `commercial-appointment-row-${
                                                        appointment.id
                                                    }`,
                                                })}
                                            />
                                        )}

                                        {/* Appointment Pagination */}
                                        {!appointmentsLoading &&
                                            totalAppointmentsCount > ITEMS_PER_PAGE && (
                                                <div className="mt-6">
                                                    <Pagination
                                                        currentPage={appointmentsCurrentPage}
                                                        totalCount={totalAppointmentsCount}
                                                        itemsPerPage={ITEMS_PER_PAGE}
                                                        onPageChange={handleAppointmentPageChange}
                                                        isLoading={appointmentsLoading}
                                                    />
                                                </div>
                                            )}

                                        {/* Appointment Results Summary */}
                                        {!appointmentsLoading && (
                                            <div className="mt-4 text-center">
                                                <Typography
                                                    element="p"
                                                    size="sm"
                                                    className="text-gray-secondary"
                                                >
                                                    {totalAppointmentsCount > 0 && (
                                                        <>
                                                            Mostrando{" "}
                                                            {(appointmentsCurrentPage - 1) *
                                                                ITEMS_PER_PAGE +
                                                                1}
                                                            -
                                                            {Math.min(
                                                                appointmentsCurrentPage *
                                                                    ITEMS_PER_PAGE,
                                                                totalAppointmentsCount,
                                                            )}{" "}
                                                            de {totalAppointmentsCount}{" "}
                                                            agendamento(s)
                                                        </>
                                                    )}
                                                    {totalAppointmentsCount === 0 &&
                                                        "Nenhum agendamento encontrado"}
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

            <Modal isOpen={isModalOpen} onClose={() => dispatch(closeModal())} className="max-w-lg">
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
