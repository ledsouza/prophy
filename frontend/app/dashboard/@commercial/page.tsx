"use client";

import { TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { FileTextIcon, InfoIcon } from "@phosphor-icons/react";
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
    useTabNavigation,
} from "@/hooks";
import type { ClientDTO } from "@/types/client";
import { ProposalDTO } from "@/redux/features/proposalApiSlice";
import { restoreSelectFilterStates, restoreTextFilterStates } from "@/utils/filter-restoration";
import { buildStandardUrlParams } from "@/utils/url-params";

import { Button, ErrorDisplay, Pagination, Spinner, Tab, Table, Modal } from "@/components/common";
import { Input, Select, CreateProposalForm } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { Modals, openModal, closeModal } from "@/redux/features/modalSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

import {
    formatCurrency,
    formatDate,
    getContractTypeDisplay,
    getStatusDisplay,
} from "@/utils/format";
import { CLIENT_STATUS_OPTIONS, CONTRACT_TYPE_OPTIONS, PROPOSAL_STATUS_OPTIONS } from "./constants";
import { SearchTab, getTabFromParam } from "./enums";
import { useSearchQueries } from "./hooks";
import {
    getClientStatusFromOptionId,
    getClientStatusOptionIdFromValue,
    getContractTypeFromOptionId,
    getContractTypeOptionIdFromValue,
    getProposalStatusFromOptionId,
    getProposalStatusOptionIdFromValue,
} from "./state";
import { ClientFilters, ProposalFilters } from "./types";

function SearchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();

    const { isModalOpen, currentModal } = useAppSelector((state) => state.modal);

    const [selectedTabIndex, setSelectedTabIndex] = useState(SearchTab.CLIENTS);

    // Client state
    const [clientCurrentPage, setClientCurrentPage] = useState(1);
    const [clientAppliedFilters, setClientAppliedFilters] = useState<ClientFilters>({
        name: "",
        cnpj: "",
        city: "",
        contract_type: "",
        status: "",
    });

    const [selectedClientName, setSelectedClientName] = useState("");
    const [selectedClientCNPJ, setSelectedClientCNPJ] = useState("");
    const [selectedClientCity, setSelectedClientCity] = useState("");
    const [selectedClientStatus, setSelectedClientStatus] = useState<SelectData>({
        id: 0,
        value: "Todos",
    });
    const [selectedClientContractType, setSelectedClientContractType] = useState<SelectData>({
        id: 0,
        value: "Todos",
    });

    // Proposal state
    const [proposalCurrentPage, setProposalCurrentPage] = useState(1);
    const [proposalAppliedFilters, setProposalAppliedFilters] = useState<ProposalFilters>({
        cnpj: "",
        contact_name: "",
        contract_type: "",
        status: "",
    });

    const [selectedProposalCNPJ, setSelectedProposalCNPJ] = useState("");
    const [selectedProposalContactName, setSelectedProposalContactName] = useState("");
    const [selectedProposalContractType, setSelectedProposalContractType] = useState<SelectData>({
        id: 0,
        value: "Todos",
    });
    const [selectedProposalStatus, setSelectedProposalStatus] = useState<SelectData>({
        id: 0,
        value: "Todos",
    });

    const {
        clientsData,
        clientsLoading,
        clientsError,
        proposalsData,
        proposalsLoading,
        proposalsError,
    } = useSearchQueries({
        clientCurrentPage,
        clientAppliedFilters,
        proposalCurrentPage,
        proposalAppliedFilters,
    });

    const clients = useMemo(() => clientsData?.results || [], [clientsData?.results]);
    const totalClientsCount = clientsData?.count || 0;

    const proposals = useMemo(() => proposalsData?.results || [], [proposalsData?.results]);
    const totalProposalsCount = proposalsData?.count || 0;

    const { handleTabChange } = useTabNavigation(setSelectedTabIndex, {
        [SearchTab.CLIENTS]: {
            tabName: "clients",
            pageKey: "client_page",
            currentPage: clientCurrentPage,
            buildFilters: () => ({
                name: selectedClientName,
                cnpj: selectedClientCNPJ,
                city: selectedClientCity,
                contract_type: getContractTypeFromOptionId(selectedClientContractType.id),
                status: getClientStatusFromOptionId(selectedClientStatus.id),
            }),
        },
        [SearchTab.PROPOSALS]: {
            tabName: "proposals",
            pageKey: "proposal_page",
            currentPage: proposalCurrentPage,
            buildFilters: () => ({
                cnpj: selectedProposalCNPJ,
                contact_name: selectedProposalContactName,
                contract_type: getContractTypeFromOptionId(selectedProposalContractType.id),
                status: getProposalStatusFromOptionId(selectedProposalStatus.id),
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
            contract_type: getContractTypeFromOptionId(selectedClientContractType.id),
            status: getClientStatusFromOptionId(selectedClientStatus.id),
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
            contract_type: getContractTypeFromOptionId(selectedClientContractType.id),
            status: getClientStatusFromOptionId(selectedClientStatus.id) as ClientFilters["status"],
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
            status: "",
        },
    });

    const { handlePageChange: handleProposalPageChange } = usePageNavigation({
        tabName: "proposals",
        pageKey: "proposal_page",
        buildFilters: () => ({
            cnpj: selectedProposalCNPJ,
            contact_name: selectedProposalContactName,
            contract_type: getContractTypeFromOptionId(selectedProposalContractType.id),
            status: getProposalStatusFromOptionId(selectedProposalStatus.id),
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
            contract_type: getContractTypeFromOptionId(selectedProposalContractType.id),
            status: getProposalStatusFromOptionId(selectedProposalStatus.id),
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
        },
        emptyFilters: {
            cnpj: "",
            contact_name: "",
            contract_type: "",
            status: "",
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
                    const clientStatus = params.get("clients_status");

                    restoreTextFilterStates(clientName, setSelectedClientName);
                    restoreTextFilterStates(clientCNPJ, setSelectedClientCNPJ);
                    restoreTextFilterStates(clientCity, setSelectedClientCity);

                    const contractTypeOptionId =
                        getContractTypeOptionIdFromValue(clientContractType);
                    const clientStatusOptionId = getClientStatusOptionIdFromValue(clientStatus);

                    restoreSelectFilterStates(
                        contractTypeOptionId.toString(),
                        CONTRACT_TYPE_OPTIONS,
                        setSelectedClientContractType
                    );
                    restoreSelectFilterStates(
                        clientStatusOptionId.toString(),
                        CLIENT_STATUS_OPTIONS,
                        setSelectedClientStatus
                    );
                },
                setAppliedFilters: setClientAppliedFilters,
                buildAppliedFilters: (params) => ({
                    name: params.get("clients_name") || "",
                    cnpj: params.get("clients_cnpj") || "",
                    city: params.get("clients_city") || "",
                    contract_type: params.get("clients_contract_type") || "",
                    status: (params.get("clients_status") as ClientFilters["status"]) || "",
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

                    restoreTextFilterStates(proposalCNPJ, setSelectedProposalCNPJ);
                    restoreTextFilterStates(proposalContactName, setSelectedProposalContactName);

                    const contractTypeOptionId =
                        getContractTypeOptionIdFromValue(proposalContractType);
                    const proposalStatusOptionId =
                        getProposalStatusOptionIdFromValue(proposalStatus);

                    restoreSelectFilterStates(
                        contractTypeOptionId.toString(),
                        CONTRACT_TYPE_OPTIONS,
                        setSelectedProposalContractType
                    );
                    restoreSelectFilterStates(
                        proposalStatusOptionId.toString(),
                        PROPOSAL_STATUS_OPTIONS,
                        setSelectedProposalStatus
                    );
                },
                setAppliedFilters: setProposalAppliedFilters,
                buildAppliedFilters: (params) => ({
                    cnpj: params.get("proposals_cnpj") || "",
                    contact_name: params.get("proposals_contact_name") || "",
                    contract_type: params.get("proposals_contract_type") || "",
                    status: params.get("proposals_status") || "",
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
                    <TabList className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
                        <Tab>Clientes</Tab>
                        <Tab>Propostas</Tab>
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
                                    label="Status"
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
                                                        header: "Status",
                                                        cell: (client: ClientDTO) =>
                                                            client.active ? "Ativo" : "Inativo",
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
                                                                    <InfoIcon size={16} />
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
                                                                    <FileTextIcon size={16} />
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
                            {/* Proposal Search Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                <Input
                                    value={selectedProposalCNPJ}
                                    onChange={(e) => setSelectedProposalCNPJ(e.target.value)}
                                    placeholder="Digite o CNPJ"
                                >
                                    CNPJ
                                </Input>

                                <Input
                                    value={selectedProposalContactName}
                                    onChange={(e) => setSelectedProposalContactName(e.target.value)}
                                    placeholder="Digite o nome do contato"
                                >
                                    Nome do Contato
                                </Input>

                                <Select
                                    options={CONTRACT_TYPE_OPTIONS}
                                    selectedData={selectedProposalContractType}
                                    setSelect={setSelectedProposalContractType}
                                    label="Tipo de Contrato"
                                    dataTestId="filter-proposal-contract-type"
                                />

                                <Select
                                    options={PROPOSAL_STATUS_OPTIONS}
                                    selectedData={selectedProposalStatus}
                                    setSelect={setSelectedProposalStatus}
                                    label="Status"
                                    dataTestId="filter-proposal-status"
                                />
                            </div>

                            {/* Proposal Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                <Button
                                    onClick={handleApplyProposalFilters}
                                    className="flex-1 sm:flex-initial"
                                    disabled={proposalsLoading}
                                    data-testid="btn-apply-proposal-filters"
                                >
                                    {proposalsLoading ? "Carregando..." : "Aplicar Filtros"}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={handleClearProposalFilters}
                                    className="flex-1 sm:flex-initial"
                                    disabled={proposalsLoading}
                                    data-testid="btn-clear-proposal-filters"
                                >
                                    Limpar Filtros
                                </Button>
                                <Button
                                    onClick={() => dispatch(openModal(Modals.CREATE_PROPOSAL))}
                                    className="flex-1 sm:flex-initial ml-auto"
                                    data-testid="btn-create-proposal"
                                >
                                    Criar Proposta
                                </Button>
                            </div>

                            {/* Proposal Results Section */}
                            <div className="bg-gray-50 rounded-xl p-6">
                                <Typography element="h2" size="title3" className="font-bold mb-4">
                                    Resultados
                                </Typography>

                                {proposalsError && (
                                    <ErrorDisplay
                                        title="Erro ao carregar propostas"
                                        message="Ocorreu um erro ao carregar os dados das propostas. Tente novamente mais tarde."
                                    />
                                )}

                                {proposals.length === 0 && !proposalsLoading ? (
                                    <div className="text-center py-8">
                                        <Typography
                                            element="p"
                                            size="lg"
                                            className="text-gray-secondary"
                                        >
                                            Nenhuma proposta encontrada com os filtros aplicados
                                        </Typography>
                                    </div>
                                ) : (
                                    <div>
                                        {proposalsLoading && (
                                            <div className="flex justify-center py-8">
                                                <Spinner />
                                            </div>
                                        )}

                                        {!proposalsLoading && (
                                            <Table
                                                data={proposals}
                                                columns={[
                                                    {
                                                        header: "Data",
                                                        cell: (proposal: ProposalDTO) =>
                                                            formatDate(proposal.date),
                                                    },
                                                    {
                                                        header: "CNPJ",
                                                        cell: (proposal: ProposalDTO) =>
                                                            cnpjMask(proposal.cnpj),
                                                    },
                                                    {
                                                        header: "Contato",
                                                        cell: (proposal: ProposalDTO) =>
                                                            proposal.contact_name,
                                                    },
                                                    {
                                                        header: "Valor",
                                                        cell: (proposal: ProposalDTO) =>
                                                            formatCurrency(proposal.value),
                                                    },
                                                    {
                                                        header: "Tipo de Contrato",
                                                        cell: (proposal: ProposalDTO) =>
                                                            getContractTypeDisplay(
                                                                proposal.contract_type
                                                            ),
                                                    },
                                                    {
                                                        header: "Status",
                                                        cell: (proposal: ProposalDTO) => {
                                                            const statusInfo = getStatusDisplay(
                                                                proposal.status
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
                                                ]}
                                                keyExtractor={(proposal: ProposalDTO) =>
                                                    proposal.id
                                                }
                                            />
                                        )}

                                        {/* Proposal Pagination */}
                                        {!proposalsLoading &&
                                            totalProposalsCount > ITEMS_PER_PAGE && (
                                                <div className="mt-6">
                                                    <Pagination
                                                        currentPage={proposalCurrentPage}
                                                        totalCount={totalProposalsCount}
                                                        itemsPerPage={ITEMS_PER_PAGE}
                                                        onPageChange={handleProposalPageChange}
                                                        isLoading={proposalsLoading}
                                                    />
                                                </div>
                                            )}

                                        {/* Proposal Results Summary */}
                                        {!proposalsLoading && (
                                            <div className="mt-4 text-center">
                                                <Typography
                                                    element="p"
                                                    size="sm"
                                                    className="text-gray-secondary"
                                                >
                                                    {totalProposalsCount > 0 && (
                                                        <>
                                                            Mostrando{" "}
                                                            {(proposalCurrentPage - 1) *
                                                                ITEMS_PER_PAGE +
                                                                1}
                                                            -
                                                            {Math.min(
                                                                proposalCurrentPage *
                                                                    ITEMS_PER_PAGE,
                                                                totalProposalsCount
                                                            )}{" "}
                                                            de {totalProposalsCount} proposta(s)
                                                        </>
                                                    )}
                                                    {totalProposalsCount === 0 &&
                                                        "Nenhuma proposta encontrada"}
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
            </Modal>
        </main>
    );
}

export default SearchPage;
