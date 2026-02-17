"use client";

import { PencilSimpleIcon } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { mask as cnpjMask } from "validation-br/dist/cnpj";

import { SelectData } from "@/components/forms/Select";
import { ITEMS_PER_PAGE } from "@/constants/pagination";
import {
    useFilterApplication,
    useFilterClear,
    useFilterRestoration,
    usePageNavigation,
} from "@/hooks";
import { ProposalDTO, useListProposalsQuery } from "@/redux/features/proposalApiSlice";
import { restoreSelectFilterStates, restoreTextFilterStates } from "@/utils/filter-restoration";

import { Button, ErrorDisplay, Pagination, Spinner, Table } from "@/components/common";
import { Input, Select } from "@/components/forms";
import { Typography } from "@/components/foundation";
import { Modals, openModal, setProposal } from "@/redux/features/modalSlice";
import { useAppDispatch } from "@/redux/hooks";

import {
    CONTRACT_TYPE_OPTIONS,
    getContractTypeFromOptionId,
    getContractTypeOptionIdFromValue,
    getProposalStatusFromOptionId,
    getProposalStatusOptionIdFromValue,
    PROPOSAL_STATUS_OPTIONS,
} from "@/constants/proposalFilters";
import { ProposalFilters } from "@/types/proposal";
import {
    formatCurrency,
    formatDate,
    formatPhoneNumber,
    getContractTypeDisplay,
    getStatusDisplay,
} from "@/utils/format";

export function ProposalsSearchSection() {
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();

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

    const proposalQueryParams = {
        page: proposalCurrentPage,
        ...(proposalAppliedFilters.cnpj && { cnpj: proposalAppliedFilters.cnpj }),
        ...(proposalAppliedFilters.contact_name && {
            contact_name: proposalAppliedFilters.contact_name,
        }),
        ...(proposalAppliedFilters.contract_type && {
            contract_type: proposalAppliedFilters.contract_type,
        }),
        ...(proposalAppliedFilters.status && { status: proposalAppliedFilters.status }),
        ...(proposalAppliedFilters.expiring_annual === "true" && { expiring_annual: "true" }),
    };

    const {
        data: proposalsData,
        isLoading: proposalsLoading,
        error: proposalsError,
    } = useListProposalsQuery(proposalQueryParams);

    const proposals = proposalsData?.results || [];
    const totalProposalsCount = proposalsData?.count || 0;

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

    useFilterRestoration({
        searchParams,
        setSelectedTabIndex: () => {},
        getTabFromParam: () => 0,
        tabs: {
            0: {
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
        },
    });

    return (
        <>
            {/* Proposal Search Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <Input
                    value={selectedProposalCNPJ}
                    onChange={(e) => setSelectedProposalCNPJ(e.target.value)}
                    placeholder="Digite o CNPJ"
                    label="CNPJ"
                    data-cy="proposals-filter-cnpj"
                ></Input>

                <Input
                    value={selectedProposalContactName}
                    onChange={(e) => setSelectedProposalContactName(e.target.value)}
                    placeholder="Digite o nome do contato"
                    label="Nome do Contato"
                ></Input>

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
                    label="Situação"
                    dataTestId="filter-proposal-status"
                />

                <div className="flex items-center gap-2 md:col-span-2 lg:col-span-3">
                    <input
                        id="expiring-annual-filter"
                        type="checkbox"
                        className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedProposalExpiringAnnual}
                        onChange={(e) => setSelectedProposalExpiringAnnual(e.target.checked)}
                    />
                    <label
                        htmlFor="expiring-annual-filter"
                        className="text-sm text-gray-primary cursor-pointer"
                    >
                        Somente propostas anuais próximas da renovação (11+ meses)
                    </label>
                </div>
            </div>

            {/* Proposal Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Button
                    onClick={handleApplyProposalFilters}
                    className="flex-1 sm:flex-initial"
                    disabled={proposalsLoading}
                    data-testid="btn-apply-proposal-filters"
                    dataCy="proposals-apply-filters"
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
            <div className="results-panel p-6">
                <Typography element="h2" size="title3" className="font-bold mb-4">
                    Resultados
                </Typography>

                {proposalAppliedFilters.expiring_annual === "true" && (
                    <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
                        <Typography element="p" size="sm" className="text-yellow-900">
                            Exibindo a proposta anual mais recente por cliente para todos os que têm
                            11 ou mais meses de vigência. A listagem é apresentada em ordem
                            crescente de data (da mais antiga para a mais recente), priorizando os
                            casos mais urgentes que requerem ação de renovação imediata.
                        </Typography>
                    </div>
                )}

                {proposalsError && (
                    <ErrorDisplay
                        title="Erro ao carregar propostas"
                        message="Ocorreu um erro ao carregar os dados das propostas. Tente novamente mais tarde."
                    />
                )}

                {proposals.length === 0 && !proposalsLoading ? (
                    <div className="text-center py-8">
                        <Typography element="p" size="lg" className="text-gray-secondary">
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
                                        cell: (proposal: ProposalDTO) => formatDate(proposal.date),
                                        width: "120px",
                                    },
                                    {
                                        header: "CNPJ",
                                        cell: (proposal: ProposalDTO) => cnpjMask(proposal.cnpj),
                                        width: "140px",
                                    },
                                    {
                                        header: "Endereço",
                                        cell: (proposal: ProposalDTO) =>
                                            `${proposal.city}, ${proposal.state}`,
                                        width: "140px",
                                    },
                                    {
                                        header: "Contato",
                                        cell: (proposal: ProposalDTO) => (
                                            <div className="flex flex-col">
                                                <span>{proposal.contact_name}</span>
                                                <span>
                                                    {formatPhoneNumber(proposal.contact_phone)}
                                                </span>
                                                <span>{proposal.email}</span>
                                            </div>
                                        ),
                                        width: "200px",
                                        multiLine: true,
                                    },
                                    {
                                        header: "Valor",
                                        cell: (proposal: ProposalDTO) =>
                                            formatCurrency(proposal.value),
                                        width: "120px",
                                    },
                                    {
                                        header: "Tipo de Contrato",
                                        cell: (proposal: ProposalDTO) =>
                                            getContractTypeDisplay(proposal.contract_type),
                                    },
                                    {
                                        header: "Situação",
                                        cell: (proposal: ProposalDTO) => {
                                            const statusInfo = getStatusDisplay(proposal.status);
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
                                        header: "Arquivos",
                                        cell: (proposal: ProposalDTO) => (
                                            <div className="flex flex-col gap-1">
                                                <a
                                                    href={`${process.env.NEXT_PUBLIC_HOST}/api/proposals/${proposal.id}/download/pdf/`}
                                                    className="text-primary hover:underline text-xs"
                                                >
                                                    PDF
                                                </a>
                                                <a
                                                    href={`${process.env.NEXT_PUBLIC_HOST}/api/proposals/${proposal.id}/download/word/`}
                                                    className="text-primary hover:underline text-xs"
                                                >
                                                    Word
                                                </a>
                                            </div>
                                        ),
                                    },
                                    {
                                        header: "Ações",
                                        cell: (proposal: ProposalDTO) => (
                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    variant="primary"
                                                    onClick={() => {
                                                        dispatch(setProposal(proposal));
                                                        dispatch(openModal(Modals.EDIT_PROPOSAL));
                                                    }}
                                                    className="flex items-center gap-2 text-xs"
                                                    data-testid={`edit-proposal-${proposal.id}`}
                                                    dataCy={`proposal-edit-${proposal.id}`}
                                                >
                                                    <PencilSimpleIcon size={16} />
                                                    Editar
                                                </Button>
                                            </div>
                                        ),
                                    },
                                ]}
                                keyExtractor={(proposal: ProposalDTO) => proposal.id}
                            />
                        )}

                        {/* Proposal Pagination */}
                        {!proposalsLoading && totalProposalsCount > ITEMS_PER_PAGE && (
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
                                <Typography element="p" size="sm" className="text-gray-secondary">
                                    {totalProposalsCount > 0 && (
                                        <>
                                            Mostrando{" "}
                                            {(proposalCurrentPage - 1) * ITEMS_PER_PAGE + 1}-
                                            {Math.min(
                                                proposalCurrentPage * ITEMS_PER_PAGE,
                                                totalProposalsCount,
                                            )}{" "}
                                            de {totalProposalsCount} proposta(s)
                                        </>
                                    )}
                                    {totalProposalsCount === 0 && "Nenhuma proposta encontrada"}
                                </Typography>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
