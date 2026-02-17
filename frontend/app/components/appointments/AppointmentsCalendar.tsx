"use client";

import type { DatesSetArg, EventInput } from "@fullcalendar/core";
import type { EventClickArg } from "@fullcalendar/core";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button, ErrorDisplay, Modal, Spinner } from "@/components/common";
import { getAppointmentStatusClasses } from "@/constants/appointmentStatus";
import AppointmentStatus from "@/enums/AppointmentStatus";
import { appointmentStatusLabel } from "@/enums/AppointmentStatus";
import { useListAppointmentsQuery } from "@/redux/features/appointmentApiSlice";
import type { AppointmentDTO, AppointmentResponsible } from "@/types/appointment";
import { formatDateTime, formatPhoneNumber } from "@/utils/format";

type AppointmentsCalendarFilters = {
    status: string;
    client_name: string;
    unit_city: string;
    unit_name: string;
};

type VisibleRange = {
    date_start: string;
    date_end: string;
};

type AppointmentsCalendarProps = {
    dataCyPrefix: string;
    filters: AppointmentsCalendarFilters;
};

export type { AppointmentsCalendarFilters };

function normalizeFilterValue(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function formatDateForApiLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function subtractDays(date: Date, days: number): Date {
    return new Date(date.getTime() - days * 86_400_000);
}

function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfNextMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60_000);
}

type CalendarEventColors = {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
};

function getCalendarEventColors(appointment: AppointmentDTO): CalendarEventColors {
    switch (appointment.status) {
        case AppointmentStatus.PENDING:
        case AppointmentStatus.RESCHEDULED:
            return {
                backgroundColor: "rgb(var(--warning) / 0.10)",
                borderColor: "rgb(var(--warning) / 0.20)",
                textColor: "rgb(var(--warning))",
            };
        case AppointmentStatus.CONFIRMED:
            return {
                backgroundColor: "rgb(var(--secondary) / 0.10)",
                borderColor: "rgb(var(--secondary) / 0.20)",
                textColor: "rgb(var(--secondary))",
            };
        case AppointmentStatus.FULFILLED:
            return {
                backgroundColor: "rgb(var(--success) / 0.10)",
                borderColor: "rgb(var(--success) / 0.20)",
                textColor: "rgb(var(--success))",
            };
        case AppointmentStatus.UNFULFILLED:
        default:
            return {
                backgroundColor: "rgb(var(--danger) / 0.10)",
                borderColor: "rgb(var(--danger) / 0.20)",
                textColor: "rgb(var(--danger))",
            };
    }
}

function getCalendarEventClasses(appointment: AppointmentDTO): string[] {
    const base = getAppointmentStatusClasses(appointment.status);
    const statusLabel = appointmentStatusLabel[appointment.status] ?? "";

    return [
        "prophy-calendar-event",
        base,
        statusLabel ? `status-${statusLabel.toLowerCase()}` : "",
    ].filter(Boolean);
}

function formatCalendarTimeLabel(dateIso: string): string {
    const date = new Date(dateIso);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}h`;
}

function getResponsibleRoleLabel(role: string): string {
    switch (role) {
        case "FMI":
            return "Físico Interno";
        case "FME":
            return "Físico Externo";
        case "GP":
            return "Prophy Manager";
        default:
            return role;
    }
}

function formatResponsibleContact(responsible: AppointmentResponsible): string {
    const email = responsible.email?.trim();
    const phone = responsible.phone ? formatPhoneNumber(responsible.phone) : null;

    if (email && phone) {
        return `${email} • ${phone}`;
    }

    return email ?? phone ?? "";
}

export default function AppointmentsCalendar({ dataCyPrefix, filters }: AppointmentsCalendarProps) {
    const [visibleRange, setVisibleRange] = useState<VisibleRange | null>(null);
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDTO | null>(null);

    useEffect(() => {
        if (visibleRange) return;

        const now = new Date();
        setVisibleRange({
            date_start: formatDateForApiLocal(startOfMonth(now)),
            date_end: formatDateForApiLocal(subtractDays(startOfNextMonth(now), 1)),
        });
    }, [visibleRange]);

    const queryParams = useMemo(() => {
        if (!visibleRange) return null;

        return {
            date_start: visibleRange.date_start,
            date_end: visibleRange.date_end,
            status: normalizeFilterValue(filters.status),
            client_name: normalizeFilterValue(filters.client_name),
            unit_city: normalizeFilterValue(filters.unit_city),
            unit_name: normalizeFilterValue(filters.unit_name),
        };
    }, [filters, visibleRange]);

    const {
        data: appointments,
        isLoading,
        error,
    } = useListAppointmentsQuery(queryParams ?? undefined, {
        skip: !queryParams,
    });

    const events: EventInput[] = useMemo(() => {
        if (!appointments) return [];

        return appointments
            .filter((appointment) => Boolean(appointment.date))
            .map((appointment) => {
                const start = new Date(appointment.date);
                const end = addMinutes(start, 60);
                const title = `${appointment.client_name ?? "N/A"} - ${
                    appointment.unit_name ?? "N/A"
                }`;
                const colors = getCalendarEventColors(appointment);

                return {
                    id: String(appointment.id),
                    title,
                    start: appointment.date,
                    end: end.toISOString(),
                    classNames: getCalendarEventClasses(appointment),
                    backgroundColor: colors.backgroundColor,
                    borderColor: colors.borderColor,
                    textColor: colors.textColor,
                    display: "block",
                    extendedProps: {
                        appointment,
                    },
                } satisfies EventInput;
            });
    }, [appointments]);

    const handleEventClick = useCallback((arg: EventClickArg) => {
        const appointment = (arg.event.extendedProps as { appointment?: AppointmentDTO })
            .appointment;

        if (!appointment) {
            return;
        }

        setSelectedAppointment(appointment);
    }, []);

    const handleViewUnitDetails = useCallback((unitId: number) => {
        window.location.href = `/dashboard/unit/${unitId}?tab=appointments`;
    }, []);

    const handleDatesSet = useCallback((arg: DatesSetArg) => {
        setVisibleRange({
            date_start: formatDateForApiLocal(arg.start),
            date_end: formatDateForApiLocal(subtractDays(arg.end, 1)),
        });
    }, []);

    if (error) {
        return (
            <ErrorDisplay
                title="Erro ao carregar agendamentos"
                message="Ocorreu um erro ao carregar os dados dos agendamentos. Tente novamente mais tarde."
            />
        );
    }

    return (
        <div
            className="prophy-calendar bg-white rounded-xl p-4"
            data-cy={`${dataCyPrefix}-calendar`}
        >
            {isLoading && (
                <div className="flex justify-center py-6">
                    <Spinner />
                </div>
            )}
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale={ptBrLocale}
                headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "",
                }}
                height="auto"
                events={events}
                datesSet={handleDatesSet}
                editable={false}
                selectable={false}
                dayMaxEventRows={4}
                eventDisplay="block"
                eventClick={handleEventClick}
                eventContent={(arg) => {
                    const appointment = (
                        arg.event.extendedProps as { appointment?: AppointmentDTO }
                    ).appointment;
                    const timeLabel = appointment ? formatCalendarTimeLabel(appointment.date) : "";

                    const fullLabel = timeLabel
                        ? `${timeLabel} ${arg.event.title}`
                        : arg.event.title;

                    return (
                        <div
                            className="min-w-0 truncate text-xs leading-snug"
                            data-cy={`${dataCyPrefix}-calendar-event`}
                            title={fullLabel}
                        >
                            {fullLabel}
                        </div>
                    );
                }}
                eventTimeFormat={{
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                }}
            />

            {!isLoading && visibleRange && events.length === 0 && (
                <div className="py-6 text-center text-gray-secondary text-sm">
                    Nenhum agendamento encontrado para o período exibido.
                </div>
            )}

            <Modal
                isOpen={Boolean(selectedAppointment)}
                onClose={() => setSelectedAppointment(null)}
                className="max-w-xl mx-4 p-6"
            >
                {selectedAppointment && (
                    <div className="space-y-4" data-cy={`${dataCyPrefix}-calendar-modal`}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-bold text-gray-primary">
                                    Detalhes do Agendamento
                                </h3>
                                <p className="text-sm text-gray-secondary">
                                    {formatDateTime(selectedAppointment.date)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="font-semibold">Cliente:</span>{" "}
                                {selectedAppointment.client_name || "N/A"}
                            </div>
                            <div>
                                <span className="font-semibold">Unidade:</span>{" "}
                                {selectedAppointment.unit_name || "N/A"}
                            </div>
                            <div>
                                <span className="font-semibold">Endereço:</span>{" "}
                                {selectedAppointment.unit_full_address || "N/A"}
                            </div>
                            <div>
                                <span className="font-semibold">Modalidade:</span>{" "}
                                {selectedAppointment.type_display || "N/A"}
                            </div>
                            <div>
                                <span className="font-semibold">Situação:</span>{" "}
                                {appointmentStatusLabel[selectedAppointment.status]}
                            </div>
                            <div>
                                <span className="font-semibold">Contato:</span>{" "}
                                {selectedAppointment.contact_name} •{" "}
                                {formatPhoneNumber(selectedAppointment.contact_phone)}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-primary">
                                Responsáveis
                            </h4>
                            {selectedAppointment.responsibles &&
                            selectedAppointment.responsibles.length > 0 ? (
                                <div className="space-y-2">
                                    {selectedAppointment.responsibles.map((responsible) => {
                                        const contact = formatResponsibleContact(responsible);

                                        return (
                                            <div
                                                key={responsible.id}
                                                className="rounded-lg border border-gray-200 bg-white px-3 py-2"
                                            >
                                                <p className="text-xs uppercase text-gray-400">
                                                    {getResponsibleRoleLabel(responsible.role)}
                                                </p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {responsible.name}
                                                </p>
                                                {contact ? (
                                                    <p className="text-xs text-gray-500">
                                                        {contact}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-gray-400">
                                                        Sem contato informado.
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-secondary">
                                    Nenhum responsável vinculado.
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="secondary"
                                onClick={() => setSelectedAppointment(null)}
                                dataCy={`${dataCyPrefix}-calendar-modal-cancel`}
                            >
                                Fechar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => handleViewUnitDetails(selectedAppointment.unit)}
                                dataCy={`${dataCyPrefix}-calendar-modal-unit-details`}
                            >
                                Ver unidade
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
