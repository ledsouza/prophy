"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { mask as cnpjMask } from "validation-br/dist/cnpj";
import { ArrowLeft } from "@phosphor-icons/react";

import { useListProposalsQuery, ProposalDTO } from "@/redux/features/proposalApiSlice";

import { ContractType, ProposalStatus } from "@/enums";

import { Typography } from "@/components/foundation";
import { Button, Spinner, Table } from "@/components/common";

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
    } = useListProposalsQuery({ cnpj: cnpj || "" }, { skip: !cnpj });

    const proposals = proposalsResponse?.results || [];

    const handleBackToSearch = () => {
        router.back();
    };

    if (isLoading) {
        return <Spinner fullscreen />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-8">
                <Typography element="h2" size="title2" className="font-bold text-danger">
                    Erro ao carregar propostas
                </Typography>
                <Typography element="p" size="lg">
                    Ocorreu um erro ao carregar as propostas. Tente novamente mais tarde.
                </Typography>
                <Button onClick={handleBackToSearch} variant="secondary">
                    Voltar à busca
                </Button>
            </div>
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
                        <Typography element="p" size="lg" className="text-gray-500 mb-4">
                            Nenhuma proposta encontrada para este cliente
                        </Typography>
                        <Typography element="p" size="sm" className="text-gray-400">
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

                        {/* Results Summary */}
                        <div className="mt-4 text-center">
                            <Typography element="p" size="sm" className="text-gray-500">
                                {proposals.length} proposta(s) encontrada(s)
                            </Typography>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default ProposalListPage;
