"use client";

import { DownloadIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import { useState } from "react";

import { Button, ErrorDisplay, Pagination, Spinner, Table } from "@/components/common";
import { Input } from "@/components/forms";
import Select, { SelectData } from "@/components/forms/Select";
import { Typography } from "@/components/foundation";
import { ITEMS_PER_PAGE } from "@/constants/pagination";
import Role from "@/enums/Role";
import {
    useLazyDownloadReportFileQuery,
    useSearchReportsQuery,
} from "@/redux/features/reportApiSlice";
import type { ReportSearchDTO, ReportStatus } from "@/types/report";
import { reportTypeLabel } from "@/types/report";
import {
    REPORT_STATUS_OPTIONS,
    getReportStatusDisplay,
    getReportStatusFromOptionId,
} from "@/types/reportStatus";
import { child } from "@/utils/logger";

const log = child({ component: "ReportsSearchTab" });

type ReportsSearchTabProps = {
    currentUserRole: Role;
};

export function ReportsSearchTab({ currentUserRole }: ReportsSearchTabProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [appliedFilters, setAppliedFilters] = useState({
        status: undefined as ReportStatus | undefined,
        due_date_start: "",
        due_date_end: "",
        client_name: "",
        client_cnpj: "",
        unit_name: "",
        unit_city: "",
    });

    const [selectedStatus, setSelectedStatus] = useState<SelectData | null>({
        id: 0,
        value: "Todos",
    });
    const [dueDateStart, setDueDateStart] = useState("");
    const [dueDateEnd, setDueDateEnd] = useState("");
    const [clientName, setClientName] = useState("");
    const [clientCNPJ, setClientCNPJ] = useState("");
    const [unitName, setUnitName] = useState("");
    const [unitCity, setUnitCity] = useState("");

    const { data, isLoading, error } = useSearchReportsQuery({
        page: currentPage,
        ...appliedFilters,
    });

    const [downloadReport] = useLazyDownloadReportFileQuery();

    const reports = data?.results || [];
    const totalCount = data?.count || 0;

    const handleApplyFilters = () => {
        setCurrentPage(1);
        setAppliedFilters({
            status: getReportStatusFromOptionId(selectedStatus?.id ?? 0),
            due_date_start: dueDateStart,
            due_date_end: dueDateEnd,
            client_name: clientName,
            client_cnpj: clientCNPJ,
            unit_name: unitName,
            unit_city: unitCity,
        });
    };

    const handleClearFilters = () => {
        setCurrentPage(1);
        setSelectedStatus({ id: 0, value: "Todos" });
        setDueDateStart("");
        setDueDateEnd("");
        setClientName("");
        setClientCNPJ("");
        setUnitName("");
        setUnitCity("");
        setAppliedFilters({
            status: undefined,
            due_date_start: "",
            due_date_end: "",
            client_name: "",
            client_cnpj: "",
            unit_name: "",
            unit_city: "",
        });
    };

    const handleDownload = async (reportId: number) => {
        try {
            await downloadReport(reportId).unwrap();
        } catch (err) {
            log.error({ reportId, error: err }, "Failed to download report");
        }
    };

    if (error) {
        return (
            <ErrorDisplay
                title="Erro ao carregar relatórios"
                message="Ocorreu um erro ao carregar os dados dos relatórios. Tente novamente mais tarde."
            />
        );
    }

    const columns = [
        {
            header: "Tipo",
            cell: (report: ReportSearchDTO) =>
                reportTypeLabel[report.report_type] || report.report_type,
        },
        {
            header: "Cliente",
            cell: (report: ReportSearchDTO) => report.client_name || "—",
        },
        {
            header: "Unidade",
            cell: (report: ReportSearchDTO) => report.unit_name || "—",
        },
        {
            header: "Data de Conclusão",
            cell: (report: ReportSearchDTO) =>
                report.completion_date
                    ? format(new Date(report.completion_date), "dd/MM/yyyy")
                    : "—",
        },
        {
            header: "Data de Vencimento",
            cell: (report: ReportSearchDTO) =>
                report.due_date ? format(new Date(report.due_date), "dd/MM/yyyy") : "—",
        },
        {
            header: "Situação",
            cell: (report: ReportSearchDTO) => {
                const statusInfo = getReportStatusDisplay(report.status);
                return (
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusInfo.color}`}
                    >
                        {statusInfo.text}
                    </span>
                );
            },
        },
        ...(currentUserRole === Role.GP
            ? [
                  {
                      header: "Responsável",
                      cell: (report: ReportSearchDTO) => report.responsibles_display || "—",
                  },
              ]
            : []),
        {
            header: "Ações",
            cell: (report: ReportSearchDTO) => (
                <Button
                    variant="primary"
                    onClick={() => handleDownload(report.id)}
                    className="flex items-center gap-2 text-xs"
                >
                    <DownloadIcon size={16} />
                    Baixar
                </Button>
            ),
        },
    ];

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <Select
                    options={REPORT_STATUS_OPTIONS}
                    selectedData={selectedStatus}
                    setSelect={setSelectedStatus}
                    label="Situação"
                    dataTestId="filter-report-status"
                />

                <Input
                    type="date"
                    value={dueDateStart}
                    onChange={(e) => setDueDateStart(e.target.value)}
                    label="Data de Vencimento (Início)"
                />

                <Input
                    type="date"
                    value={dueDateEnd}
                    onChange={(e) => setDueDateEnd(e.target.value)}
                    label="Data de Vencimento (Fim)"
                />

                <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Digite o nome do cliente"
                    label="Cliente"
                />

                <Input
                    value={clientCNPJ}
                    onChange={(e) => setClientCNPJ(e.target.value)}
                    placeholder="Digite o CNPJ"
                    label="CNPJ"
                />

                <Input
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    placeholder="Digite o nome da unidade"
                    label="Unidade"
                />

                <Input
                    value={unitCity}
                    onChange={(e) => setUnitCity(e.target.value)}
                    placeholder="Digite a cidade"
                    label="Cidade da Unidade"
                />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Button
                    onClick={handleApplyFilters}
                    className="flex-1 sm:flex-initial"
                    disabled={isLoading}
                    data-testid="btn-apply-report-filters"
                >
                    {isLoading ? "Carregando..." : "Aplicar Filtros"}
                </Button>
                <Button
                    variant="secondary"
                    onClick={handleClearFilters}
                    className="flex-1 sm:flex-initial"
                    disabled={isLoading}
                    data-testid="btn-clear-report-filters"
                >
                    Limpar Filtros
                </Button>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
                <Typography element="h2" size="title3" className="font-bold mb-4">
                    Resultados
                </Typography>

                {reports.length === 0 && !isLoading ? (
                    <div className="text-center py-8">
                        <Typography element="p" size="lg" className="text-gray-secondary">
                            Nenhum relatório encontrado com os filtros aplicados
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
                                data={reports}
                                columns={columns}
                                keyExtractor={(report: ReportSearchDTO) => report.id}
                            />
                        )}

                        {!isLoading && totalCount > ITEMS_PER_PAGE && (
                            <div className="mt-6">
                                <Pagination
                                    currentPage={currentPage}
                                    totalCount={totalCount}
                                    itemsPerPage={ITEMS_PER_PAGE}
                                    onPageChange={setCurrentPage}
                                    isLoading={isLoading}
                                />
                            </div>
                        )}

                        {!isLoading && (
                            <div className="mt-4 text-center">
                                <Typography element="p" size="sm" className="text-gray-secondary">
                                    {totalCount > 0 && (
                                        <>
                                            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                                            {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de{" "}
                                            {totalCount} relatório(s)
                                        </>
                                    )}
                                    {totalCount === 0 && "Nenhum relatório encontrado"}
                                </Typography>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
