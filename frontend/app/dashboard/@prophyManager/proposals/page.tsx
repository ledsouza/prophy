"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { mask as cnpjMask } from "validation-br/dist/cnpj";
import { ArrowLeft } from "@phosphor-icons/react";

import { useListProposalsQuery, ProposalDTO } from "@/redux/features/proposalApiSlice";

import { ContractType, ProposalStatus } from "@/enums";
import { ITEMS_PER_PAGE } from "@/constants/pagination";

import { Typography } from "@/components/foundation";
import { Button, ErrorDisplay, Pagination, Spinner, Table } from "@/components/common";

const getStatusDisplay = (status: string) => {
    switch (status) {
        case ProposalStatus.ACCEPTED:
            return { text: "Aceito", color: "text-success bg-success/10" };
        case ProposalStatus.REJECTED:
            return { text: "Rejeitado", color: "text-danger bg-danger/10" };
        case ProposalStatus.PENDING:
            return { text: "Pendente", color: "text-warning bg-warning/10" };
        default:
            return { text: "Desconhecido", color: "text-gray-secondary bg-gray-100" };
    }
};

const getContractTypeDisplay = (contractType: string) => {
    switch (contractType) {
        case ContractType.ANNUAL:
            return "Anual";
        case ContractType.MONTHLY:
            return "Mensal";
        case ContractType.WEEKLY:
            return "Semanal";
        default:
            return contractType;
    }
};

const formatCurrency = (value: string): string => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return "R$ 0,00";

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(numericValue);
};

const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch {
        return dateString;
    }
};

function ProposalListPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const cnpj = searchParams.get("cnpj");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = ITEMS_PER_PAGE;

    // Handle URL parameters restoration on mount
    useEffect(() => {
        const pageParam = searchParams.get("page");
        if (pageParam) {
            const page = parseInt(pageParam, 10);
            if (page > 0 && page !== currentPage) {
                setCurrentPage(page);
            }
        }
    }, [searchParams]);

    // Reset to page 1 when CNPJ changes
    useEffect(() => {
        if (cnpj && currentPage !== 1) {
            setCurrentPage(1);
            // Update URL to reflect page reset
            const params = new URLSearchParams(searchParams);
            params.set("page", "1");
            router.replace(`?${params.toString()}`);
        }
    }, [cnpj]);

    // Validate CNPJ parameter
    useEffect(() => {
        if (!cnpj) {
            router.push("/dashboard");
            return;
        }
    }, [cnpj, router]);

    const {
        data: proposalsResponse,
        isLoading,
        error,
    } = useListProposalsQuery({ cnpj: cnpj || "", page: currentPage }, { skip: !cnpj });

    const proposals = proposalsResponse?.results || [];
    const totalCount = proposalsResponse?.count || 0;

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);

        // Update URL with new page while preserving CNPJ
        const params = new URLSearchParams(searchParams);
        params.set("page", page.toString());
        router.push(`?${params.toString()}`);
    };

    const handleBackToSearch = () => {
        router.back();
    };

    if (isLoading) {
        return <Spinner fullscreen />;
    }

    if (error) {
        return (
            <ErrorDisplay
                title="Erro ao carregar propostas"
                message="Ocorreu um erro ao carregar as propostas. Tente novamente mais tarde."
                action={{
                    text: "Voltar à busca",
                    onClick: handleBackToSearch,
                }}
            />
        );
    }

    // Don't render if no CNPJ
    if (!cnpj) {
        return null;
    }

    const columns = [
        {
            header: "Data",
            cell: (proposal: ProposalDTO) => formatDate(proposal.date),
        },
        {
            header: "Valor",
            cell: (proposal: ProposalDTO) => formatCurrency(proposal.value),
        },
        {
            header: "Tipo de Contrato",
            cell: (proposal: ProposalDTO) => getContractTypeDisplay(proposal.contract_type),
        },
        {
            header: "Status",
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
    ];

    return (
        <main className="flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-4">
            {/* Header Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                <div className="flex items-center gap-4 mb-4">
                    <Button
                        onClick={handleBackToSearch}
                        variant="secondary"
                        className="flex items-center gap-2 px-3 py-2"
                        data-testid="btn-back-to-search"
                    >
                        <ArrowLeft size={16} />
                        Voltar
                    </Button>
                </div>

                <Typography element="h1" size="title2" className="font-bold">
                    Propostas para Cliente: {cnpjMask(cnpj)}
                </Typography>
            </div>

            {/* Proposals Table Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                <Typography element="h2" size="title3" className="font-bold mb-4">
                    Lista de Propostas
                </Typography>

                {proposals.length === 0 ? (
                    <div className="text-center py-12">
                        <Typography element="p" size="lg" className="text-gray-secondary mb-4">
                            Nenhuma proposta encontrada para este cliente
                        </Typography>
                        <Typography element="p" size="sm" className="text-gray-secondary">
                            CNPJ: {cnpjMask(cnpj)}
                        </Typography>
                    </div>
                ) : (
                    <div>
                        <Table
                            data={proposals}
                            columns={columns}
                            keyExtractor={(proposal: ProposalDTO) => proposal.id}
                        />

                        {/* Pagination */}
                        {totalCount > itemsPerPage && (
                            <div className="mt-6">
                                <Pagination
                                    currentPage={currentPage}
                                    totalCount={totalCount}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={handlePageChange}
                                    isLoading={isLoading}
                                />
                            </div>
                        )}

                        {/* Results Summary */}
                        <div className="mt-4 text-center">
                            <Typography element="p" size="sm" className="text-gray-secondary">
                                {totalCount > 0 && (
                                    <>
                                        Mostrando {(currentPage - 1) * itemsPerPage + 1}-
                                        {Math.min(currentPage * itemsPerPage, totalCount)} de{" "}
                                        {totalCount} proposta(s) encontrada(s)
                                    </>
                                )}
                                {totalCount === 0 && "Nenhuma proposta encontrada"}
                            </Typography>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default ProposalListPage;
