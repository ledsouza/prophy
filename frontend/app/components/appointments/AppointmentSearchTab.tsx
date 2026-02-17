"use client";

import { InfoIcon } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ITEMS_PER_PAGE } from "@/constants/pagination";
import { appointmentStatusLabel } from "@/enums/AppointmentStatus";
import { useFilterApplication, useFilterClear, usePageNavigation } from "@/hooks";
import { useListAppointmentsPageQuery } from "@/redux/features/appointmentApiSlice";
import type { AppointmentDTO } from "@/types/appointment";

import {
    Button,
    ErrorDisplay,
    MobileResultCard,
    Pagination,
    Spinner,
    Table,
} from "@/components/common";
import { Input, Select } from "@/components/forms";
import type { SelectData } from "@/components/forms/Select";
import { Typography } from "@/components/foundation";

import {
    APPOINTMENT_STATUS_OPTIONS,
    getAppointmentStatusClasses,
    getAppointmentStatusFromOptionId,
} from "@/constants/appointmentStatus";
import { formatDateTime } from "@/utils/format";

import AppointmentsCalendar from "./AppointmentsCalendar";

type AppointmentFilters = {
    date_start: string;
    date_end: string;
    status: string;
    client_name: string;
    unit_city: string;
    unit_name: string;
};

type AppointmentSearchTabProps = {
    canCreate?: boolean;
    dataCyPrefix?: string;
    onOpenCreateAppointment?: () => void;
};

type ViewMode = "list" | "calendar";

const EMPTY_FILTERS: AppointmentFilters = {
    date_start: "",
    date_end: "",
    status: "",
    client_name: "",
    unit_city: "",
    unit_name: "",
};

export default function AppointmentSearchTab({
    canCreate = true,
    dataCyPrefix = "appointments",
    onOpenCreateAppointment,
}: AppointmentSearchTabProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const viewModeFromUrl = useMemo<ViewMode>(() => {
        const view = searchParams.get("view");
        return view === "calendar" ? "calendar" : "list";
    }, [searchParams]);

    const [viewMode, setViewMode] = useState<ViewMode>(viewModeFromUrl);

    useEffect(() => {
        setViewMode(viewModeFromUrl);
    }, [viewModeFromUrl]);

    const [currentPage, setCurrentPage] = useState(1);
    const [appliedFilters, setAppliedFilters] = useState<AppointmentFilters>(EMPTY_FILTERS);

    const [selectedDateStart, setSelectedDateStart] = useState("");
    const [selectedDateEnd, setSelectedDateEnd] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<SelectData | null>({
        id: 0,
        value: "Todos",
    });
    const [selectedClientName, setSelectedClientName] = useState("");
    const [selectedUnitCity, setSelectedUnitCity] = useState("");
    const [selectedUnitName, setSelectedUnitName] = useState("");

    const queryParams = useMemo(() => {
        const params: Record<string, unknown> = { page: currentPage };

        if (appliedFilters.date_start) params.date_start = appliedFilters.date_start;
        if (appliedFilters.date_end) params.date_end = appliedFilters.date_end;
        if (appliedFilters.status) params.status = appliedFilters.status;
        if (appliedFilters.client_name) params.client_name = appliedFilters.client_name;
        if (appliedFilters.unit_city) params.unit_city = appliedFilters.unit_city;
        if (appliedFilters.unit_name) params.unit_name = appliedFilters.unit_name;

        return params;
    }, [currentPage, appliedFilters]);

    const {
        data: appointmentsData,
        isLoading: appointmentsLoading,
        error: appointmentsError,
    } = useListAppointmentsPageQuery(queryParams);

    const appointments = useMemo(
        () => appointmentsData?.results || [],
        [appointmentsData?.results],
    );
    const totalAppointmentsCount = appointmentsData?.count || 0;

    const tabName = "appointments";
    const pageKey = "appointments_page";

    const { handleApplyFilters } = useFilterApplication({
        tabName,
        pageKey,
        currentPage,
        setCurrentPage,
        setAppliedFilters,
        preserveParams: ["view"],
        buildFilters: () => ({
            date_start: selectedDateStart,
            date_end: selectedDateEnd,
            status: getAppointmentStatusFromOptionId(selectedStatus?.id ?? 0),
            client_name: selectedClientName,
            unit_city: selectedUnitCity,
            unit_name: selectedUnitName,
        }),
    });

    const { handleClearFilters } = useFilterClear<AppointmentFilters>({
        tabName,
        pageKey,
        setCurrentPage,
        setAppliedFilters,
        preserveParams: ["view"],
        resetFilters: () => {
            setSelectedDateStart("");
            setSelectedDateEnd("");
            setSelectedStatus({ id: 0, value: "Todos" });
            setSelectedClientName("");
            setSelectedUnitCity("");
            setSelectedUnitName("");
        },
        emptyFilters: EMPTY_FILTERS,
    });

    const { handlePageChange } = usePageNavigation({
        tabName,
        pageKey,
        preserveParams: ["view"],
        buildFilters: () => ({
            date_start: selectedDateStart,
            date_end: selectedDateEnd,
            status: getAppointmentStatusFromOptionId(selectedStatus?.id ?? 0),
            client_name: selectedClientName,
            unit_city: selectedUnitCity,
            unit_name: selectedUnitName,
        }),
        setCurrentPage,
    });

    const handleViewUnitDetails = (unitId: number) => {
        router.push(`/dashboard/unit/${unitId}?tab=appointments`);
    };

    const handleSetViewMode = (nextViewMode: ViewMode) => {
        setViewMode(nextViewMode);

        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", "appointments");

        if (!params.get(pageKey)) {
            params.set(pageKey, String(currentPage));
        }
        if (nextViewMode === "calendar") {
            params.set("view", "calendar");
        } else {
            params.delete("view");
        }
        router.push(`?${params.toString()}`, { scroll: false });
    };

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <Input
                    type="date"
                    value={selectedDateStart}
                    onChange={(e) => setSelectedDateStart(e.target.value)}
                    label="Data Início"
                    dataCy={`${dataCyPrefix}-filter-date-start`}
                />

                <Input
                    type="date"
                    value={selectedDateEnd}
                    onChange={(e) => setSelectedDateEnd(e.target.value)}
                    label="Data Fim"
                    dataCy={`${dataCyPrefix}-filter-date-end`}
                />

                <Select
                    options={APPOINTMENT_STATUS_OPTIONS}
                    selectedData={selectedStatus}
                    setSelect={setSelectedStatus}
                    label="Situação"
                    dataCy={`${dataCyPrefix}-filter-status`}
                />

                <Input
                    value={selectedClientName}
                    onChange={(e) => setSelectedClientName(e.target.value)}
                    placeholder="Digite o nome do cliente"
                    label="Nome do Cliente"
                    dataCy={`${dataCyPrefix}-filter-client-name`}
                />

                <Input
                    value={selectedUnitCity}
                    onChange={(e) => setSelectedUnitCity(e.target.value)}
                    placeholder="Digite a cidade da unidade"
                    label="Cidade da Unidade"
                    dataCy={`${dataCyPrefix}-filter-unit-city`}
                />

                <Input
                    value={selectedUnitName}
                    onChange={(e) => setSelectedUnitName(e.target.value)}
                    placeholder="Digite o nome da unidade"
                    label="Nome da Unidade"
                    dataCy={`${dataCyPrefix}-filter-unit-name`}
                />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Button
                    onClick={handleApplyFilters}
                    className="flex-1 sm:flex-initial"
                    disabled={appointmentsLoading}
                    dataCy={`${dataCyPrefix}-apply-filters`}
                >
                    {appointmentsLoading ? "Carregando..." : "Aplicar Filtros"}
                </Button>
                <Button
                    variant="secondary"
                    onClick={handleClearFilters}
                    className="flex-1 sm:flex-initial"
                    disabled={appointmentsLoading}
                    dataCy={`${dataCyPrefix}-clear-filters`}
                >
                    Limpar Filtros
                </Button>
                {canCreate && (
                    <Button
                        onClick={onOpenCreateAppointment}
                        className="flex-1 sm:flex-initial ml-auto"
                        dataCy={`${dataCyPrefix}-create-appointment`}
                        disabled={!onOpenCreateAppointment}
                    >
                        Novo Agendamento
                    </Button>
                )}
            </div>

            <div className="results-panel p-6" data-cy={`${dataCyPrefix}-results`}>
                <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
                    <Typography element="h2" size="title3" className="font-bold">
                        Resultados
                    </Typography>

                    <div className="hidden items-center rounded-lg bg-white p-1 shadow-sm sm:flex">
                        <button
                            type="button"
                            onClick={() => handleSetViewMode("list")}
                            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                                viewMode === "list"
                                    ? "bg-primary text-white"
                                    : "text-gray-primary hover:bg-gray-100"
                            }`}
                            data-cy={`${dataCyPrefix}-view-toggle-list`}
                        >
                            Lista
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSetViewMode("calendar")}
                            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                                viewMode === "calendar"
                                    ? "bg-primary text-white"
                                    : "text-gray-primary hover:bg-gray-100"
                            }`}
                            data-cy={`${dataCyPrefix}-view-toggle-calendar`}
                        >
                            Calendário
                        </button>
                    </div>
                </div>

                {appointmentsError && (
                    <ErrorDisplay
                        title="Erro ao carregar agendamentos"
                        message="Ocorreu um erro ao carregar os dados dos agendamentos. Tente novamente mais tarde."
                    />
                )}

                {viewMode === "calendar" ? (
                    <div className="hidden sm:block">
                        <AppointmentsCalendar
                            dataCyPrefix={dataCyPrefix}
                            filters={{
                                status: appliedFilters.status,
                                client_name: appliedFilters.client_name,
                                unit_city: appliedFilters.unit_city,
                                unit_name: appliedFilters.unit_name,
                            }}
                        />
                    </div>
                ) : appointments.length === 0 && !appointmentsLoading ? (
                    <div className="text-center py-8">
                        <Typography element="p" size="lg" className="text-gray-secondary">
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
                                            const statusClasses = getAppointmentStatusClasses(
                                                appointment.status,
                                            );
                                            return (
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses}`}
                                                >
                                                    {appointmentStatusLabel[appointment.status]}
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
                                                        handleViewUnitDetails(appointment.unit)
                                                    }
                                                    className="flex items-center gap-2 text-xs"
                                                    dataCy={`${dataCyPrefix}-appointment-details-${appointment.id}`}
                                                >
                                                    Detalhes
                                                </Button>
                                            </div>
                                        ),
                                    },
                                ]}
                                keyExtractor={(appointment: AppointmentDTO) => appointment.id}
                                mobileCardRenderer={(appointment: AppointmentDTO) => {
                                    const statusClasses = getAppointmentStatusClasses(
                                        appointment.status,
                                    );
                                    return (
                                        <MobileResultCard
                                            dataCy={`${dataCyPrefix}-appointment-card-${appointment.id}`}
                                            title={appointment.client_name || "Cliente"}
                                            badge={
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses}`}
                                                >
                                                    {appointmentStatusLabel[appointment.status]}
                                                </span>
                                            }
                                            fields={[
                                                {
                                                    label: "Data/Hora",
                                                    value: formatDateTime(appointment.date),
                                                },
                                                {
                                                    label: "Cliente",
                                                    value: appointment.client_name || "N/A",
                                                },
                                                {
                                                    label: "Unidade",
                                                    value: appointment.unit_name || "N/A",
                                                },
                                                {
                                                    label: "Endereço",
                                                    value: appointment.unit_full_address || "N/A",
                                                },
                                                {
                                                    label: "Modalidade",
                                                    value: appointment.type_display || "N/A",
                                                },
                                            ]}
                                            actions={
                                                <Button
                                                    variant="primary"
                                                    onClick={() =>
                                                        handleViewUnitDetails(appointment.unit)
                                                    }
                                                    className="flex items-center gap-2 text-xs"
                                                    dataCy={`${dataCyPrefix}-appointment-details-${appointment.id}`}
                                                >
                                                    <InfoIcon size={16} />
                                                    Detalhes
                                                </Button>
                                            }
                                        />
                                    );
                                }}
                                rowProps={(appointment: AppointmentDTO) => ({
                                    "data-cy": `${dataCyPrefix}-appointment-row-${appointment.id}`,
                                })}
                            />
                        )}

                        {!appointmentsLoading &&
                            viewMode === "list" &&
                            totalAppointmentsCount > ITEMS_PER_PAGE && (
                                <div className="mt-6">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalCount={totalAppointmentsCount}
                                        itemsPerPage={ITEMS_PER_PAGE}
                                        onPageChange={handlePageChange}
                                        isLoading={appointmentsLoading}
                                    />
                                </div>
                            )}
                    </div>
                )}
            </div>
        </div>
    );
}
