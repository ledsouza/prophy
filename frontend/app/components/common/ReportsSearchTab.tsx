"use client";

import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button, ErrorDisplay, Modal, Pagination, Spinner, Table } from "@/components/common";
import { Input } from "@/components/forms";
import Select, { SelectData } from "@/components/forms/Select";
import { Typography } from "@/components/foundation";
import { ITEMS_PER_PAGE } from "@/constants/pagination";
import Role from "@/enums/Role";
import {
    useFilterApplication,
    useFilterClear,
    useFilterRestoration,
    usePageNavigation,
} from "@/hooks";
import {
    useHardDeleteReportMutation,
    useLazyDownloadReportFileQuery,
    useRestoreReportMutation,
    useSearchReportsQuery,
    useSoftDeleteReportMutation,
} from "@/redux/features/reportApiSlice";
import type { ReportSearchDTO, ReportStatus } from "@/types/report";
import { reportTypeLabel } from "@/types/report";
import {
    REPORT_STATUS_OPTIONS,
    getReportStatusDisplay,
    getReportStatusFromOptionId,
    getReportStatusOptionIdFromValue,
} from "@/types/reportStatus";
import { restoreSelectFilterStates, restoreTextFilterStates } from "@/utils/filter-restoration";
import { child } from "@/utils/logger";
import { toast } from "react-toastify";

const log = child({ component: "ReportsSearchTab" });

type ReportsSearchTabProps = {
    currentUserRole: Role;
};

export function ReportsSearchTab({ currentUserRole }: ReportsSearchTabProps) {
    const isGP = currentUserRole === Role.GP;
    const searchParams = useSearchParams();

    const [currentPage, setCurrentPage] = useState(1);
    const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
    const [softDeleteConfirmOpen, setSoftDeleteConfirmOpen] = useState(false);
    const [hardDeleteConfirmOpen, setHardDeleteConfirmOpen] = useState(false);
    const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState({
        status: undefined as ReportStatus | undefined,
        due_date_start: "",
        due_date_end: "",
        client_name: "",
        client_cnpj: "",
        unit_name: "",
        unit_city: "",
        responsible_cpf: "",
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
    const [responsibleCpf, setResponsibleCpf] = useState("");

    const { data, isLoading, error } = useSearchReportsQuery({
        page: currentPage,
        ...appliedFilters,
    });

    const [downloadReport] = useLazyDownloadReportFileQuery();
    const [softDeleteReport, { isLoading: isSoftDeleting }] = useSoftDeleteReportMutation();
    const [hardDeleteReport, { isLoading: isHardDeleting }] = useHardDeleteReportMutation();
    const [restoreReport, { isLoading: isRestoring }] = useRestoreReportMutation();

    const reports = data?.results || [];
    const totalCount = data?.count || 0;

    const { handleApplyFilters } = useFilterApplication({
        tabName: "reports",
        pageKey: "report_page",
        currentPage,
        setCurrentPage,
        setAppliedFilters,
        buildFilters: () => ({
            status: getReportStatusFromOptionId(selectedStatus?.id ?? 0),
            due_date_start: dueDateStart,
            due_date_end: dueDateEnd,
            client_name: clientName,
            client_cnpj: clientCNPJ,
            unit_name: unitName,
            unit_city: unitCity,
            responsible_cpf: responsibleCpf,
        }),
    });

    const { handleClearFilters } = useFilterClear({
        tabName: "reports",
        pageKey: "report_page",
        setCurrentPage,
        setAppliedFilters,
        resetFilters: () => {
            setSelectedStatus({ id: 0, value: "Todos" });
            setDueDateStart("");
            setDueDateEnd("");
            setClientName("");
            setClientCNPJ("");
            setUnitName("");
            setUnitCity("");
            setResponsibleCpf("");
        },
        emptyFilters: {
            status: undefined,
            due_date_start: "",
            due_date_end: "",
            client_name: "",
            client_cnpj: "",
            unit_name: "",
            unit_city: "",
            responsible_cpf: "",
        },
    });

    const { handlePageChange } = usePageNavigation({
        tabName: "reports",
        pageKey: "report_page",
        buildFilters: () => ({
            status: String(selectedStatus?.id ?? 0),
            due_date_start: dueDateStart,
            due_date_end: dueDateEnd,
            client_name: clientName,
            client_cnpj: clientCNPJ,
            unit_name: unitName,
            unit_city: unitCity,
            responsible_cpf: responsibleCpf,
        }),
        setCurrentPage,
    });

    useFilterRestoration({
        searchParams,
        setSelectedTabIndex: () => {},
        getTabFromParam: () => 0,
        tabs: {
            0: {
                pageParam: "report_page",
                currentPage,
                setCurrentPage,
                restoreFilters: (params) => {
                    const status = params.get("reports_status");
                    const dueDateStart = params.get("reports_due_date_start") || "";
                    const dueDateEnd = params.get("reports_due_date_end") || "";
                    const clientName = params.get("reports_client_name") || "";
                    const clientCnpj = params.get("reports_client_cnpj") || "";
                    const unitName = params.get("reports_unit_name") || "";
                    const unitCity = params.get("reports_unit_city") || "";
                    const responsibleCpf = params.get("reports_responsible_cpf") || "";

                    restoreTextFilterStates(dueDateStart, setDueDateStart);
                    restoreTextFilterStates(dueDateEnd, setDueDateEnd);
                    restoreTextFilterStates(clientName, setClientName);
                    restoreTextFilterStates(clientCnpj, setClientCNPJ);
                    restoreTextFilterStates(unitName, setUnitName);
                    restoreTextFilterStates(unitCity, setUnitCity);
                    restoreTextFilterStates(responsibleCpf, setResponsibleCpf);

                    const statusOptionId = getReportStatusOptionIdFromValue(status);
                    restoreSelectFilterStates(
                        statusOptionId.toString(),
                        REPORT_STATUS_OPTIONS,
                        setSelectedStatus,
                    );
                },
                setAppliedFilters,
                buildAppliedFilters: (params) => ({
                    status: (params.get("reports_status") as ReportStatus | null) || undefined,
                    due_date_start: params.get("reports_due_date_start") || "",
                    due_date_end: params.get("reports_due_date_end") || "",
                    client_name: params.get("reports_client_name") || "",
                    client_cnpj: params.get("reports_client_cnpj") || "",
                    unit_name: params.get("reports_unit_name") || "",
                    unit_city: params.get("reports_unit_city") || "",
                    responsible_cpf: params.get("reports_responsible_cpf") || "",
                }),
            },
        },
    });

    const handleDownload = async (reportId: number) => {
        try {
            await downloadReport(reportId).unwrap();
        } catch (err) {
            log.error({ reportId, error: err }, "Failed to download report");
        }
    };

    async function handleSoftDelete() {
        if (!selectedReportId) return;
        try {
            await softDeleteReport({ id: selectedReportId }).unwrap();
            toast.success("Relatório arquivado com sucesso.");
            setSoftDeleteConfirmOpen(false);
            setSelectedReportId(null);
            log.info({ reportId: selectedReportId }, "Report soft deleted successfully");
        } catch (err) {
            log.error({ reportId: selectedReportId, error: err }, "Soft delete failed");
            toast.error("Não foi possível arquivar o relatório.");
        }
    }

    async function handleHardDelete() {
        if (!selectedReportId) return;
        try {
            await hardDeleteReport({ id: selectedReportId }).unwrap();
            toast.success("Relatório excluído permanentemente.");
            setHardDeleteConfirmOpen(false);
            setSelectedReportId(null);
            log.info({ reportId: selectedReportId }, "Report hard deleted successfully");
        } catch (err) {
            log.error({ reportId: selectedReportId, error: err }, "Hard delete failed");
            toast.error("Não foi possível excluir o relatório permanentemente.");
        }
    }

    async function handleRestore() {
        if (!selectedReportId) return;
        try {
            await restoreReport({ id: selectedReportId }).unwrap();
            toast.success("Relatório desarquivado com sucesso.");
            setRestoreConfirmOpen(false);
            setSelectedReportId(null);
            log.info({ reportId: selectedReportId }, "Report restored successfully");
        } catch (err) {
            log.error({ reportId: selectedReportId, error: err }, "Restore failed");
            toast.error("Não foi possível desarquivar o relatório.");
        }
    }

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
            cell: (report: ReportSearchDTO) => (
                <div className="flex items-center gap-2">
                    <span>{reportTypeLabel[report.report_type] || report.report_type}</span>
                </div>
            ),
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
        ...(isGP
            ? [
                  {
                      header: "Responsável",
                      cell: (report: ReportSearchDTO) => report.responsibles_display || "—",
                  },
              ]
            : []),
        {
            header: "Ações",
            width: "8rem",
            cell: (report: ReportSearchDTO) => (
                <div className="flex flex-col gap-2 items-stretch">
                    <Button
                        variant="primary"
                        onClick={() => handleDownload(report.id)}
                        className="w-full text-xs"
                        data-testid={`btn-download-${report.id}`}
                        dataCy={`report-download-${report.id}`}
                    >
                        Baixar
                    </Button>
                    {isGP && !report.is_deleted && (
                        <Button
                            variant="danger"
                            onClick={() => {
                                setSelectedReportId(report.id);
                                setSoftDeleteConfirmOpen(true);
                            }}
                            className="w-full text-xs"
                            data-testid={`btn-soft-delete-${report.id}`}
                            dataCy={`report-soft-delete-${report.id}`}
                        >
                            Arquivar
                        </Button>
                    )}
                    {isGP && report.is_deleted && (
                        <>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setSelectedReportId(report.id);
                                    setRestoreConfirmOpen(true);
                                }}
                                className="w-full text-xs"
                                data-testid={`btn-restore-${report.id}`}
                                dataCy={`report-restore-${report.id}`}
                            >
                                Desarquivar
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => {
                                    setSelectedReportId(report.id);
                                    setHardDeleteConfirmOpen(true);
                                }}
                                className="w-full text-xs"
                                data-testid={`btn-hard-delete-${report.id}`}
                                dataCy={`report-hard-delete-${report.id}`}
                            >
                                Excluir
                            </Button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div data-cy="reports-search-tab">
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
                    label="CNPJ do Cliente"
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

                <Input
                    value={responsibleCpf}
                    onChange={(e) =>
                        setResponsibleCpf(e.target.value.replace(/\D/g, "").slice(0, 11))
                    }
                    placeholder="Digite o CPF"
                    label="CPF do físico responsável"
                    dataCy="reports-filter-responsible-cpf"
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

            <div className="bg-gray-50 rounded-xl p-6" data-cy="reports-results">
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
                                    onPageChange={handlePageChange}
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

            {/* Soft Delete Confirmation Modal */}
            <Modal
                isOpen={softDeleteConfirmOpen}
                onClose={() => {
                    setSoftDeleteConfirmOpen(false);
                    setSelectedReportId(null);
                }}
                className="max-w-md px-2 py-4 sm:px-6"
            >
                <div className="flex flex-col gap-4">
                    <Typography element="h3" size="lg">
                        Arquivar relatório
                    </Typography>
                    <Typography element="p" size="md">
                        Tem certeza que deseja arquivar este relatório? Ele poderá ser desarquivado
                        posteriormente.
                    </Typography>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setSoftDeleteConfirmOpen(false);
                                setSelectedReportId(null);
                            }}
                            disabled={isSoftDeleting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleSoftDelete}
                            disabled={isSoftDeleting}
                            data-testid="btn-confirm-soft-delete-search"
                            dataCy="report-soft-delete-confirm"
                        >
                            {isSoftDeleting ? "Arquivando..." : "Arquivar"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Hard Delete Confirmation Modal */}
            <Modal
                isOpen={hardDeleteConfirmOpen}
                onClose={() => {
                    setHardDeleteConfirmOpen(false);
                    setSelectedReportId(null);
                }}
                className="max-w-md px-2 py-4 sm:px-6"
            >
                <div className="flex flex-col gap-4">
                    <Typography element="h3" size="lg" className="text-red-600">
                        Excluir permanentemente
                    </Typography>
                    <Typography element="p" size="md">
                        <strong>ATENÇÃO:</strong> Esta ação é irreversível! O relatório será
                        excluído permanentemente do banco de dados e não poderá ser recuperado.
                    </Typography>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setHardDeleteConfirmOpen(false);
                                setSelectedReportId(null);
                            }}
                            disabled={isHardDeleting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleHardDelete}
                            disabled={isHardDeleting}
                            data-testid="btn-confirm-hard-delete-search"
                            dataCy="report-hard-delete-confirm"
                        >
                            {isHardDeleting ? "Excluindo..." : "Excluir Permanentemente"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Restore Confirmation Modal */}
            <Modal
                isOpen={restoreConfirmOpen}
                onClose={() => {
                    setRestoreConfirmOpen(false);
                    setSelectedReportId(null);
                }}
                className="max-w-md px-2 py-4 sm:px-6"
            >
                <div className="flex flex-col gap-4">
                    <Typography element="h3" size="lg">
                        Desarquivar relatório
                    </Typography>
                    <Typography element="p" size="md">
                        Tem certeza que deseja desarquivar este relatório? Ele voltará a ficar ativo
                        no sistema.
                    </Typography>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setRestoreConfirmOpen(false);
                                setSelectedReportId(null);
                            }}
                            disabled={isRestoring}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleRestore}
                            disabled={isRestoring}
                            data-testid="btn-confirm-restore-search"
                            dataCy="report-restore-confirm"
                        >
                            {isRestoring ? "Desarquivando..." : "Desarquivar"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
