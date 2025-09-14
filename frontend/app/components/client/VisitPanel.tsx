"use client";

import { VisitList } from "@/components/client";
import { Button, ErrorDisplay, Spinner } from "@/components/common";
import { useListVisitsQuery } from "@/redux/features/visitApiSlice";
import clsx from "clsx";

type VisitPanelProps = {
    unitId?: number;
    onScheduleVisit?: () => void;
    scheduleButtonTestId?: string;
    containerClassName?: string;
};

/**
 * VisitPanel component for displaying and managing visits for a specific unit.
 *
 * Fetches visits with useListVisitsQuery and displays them in a VisitList. Also provides
 * a button to schedule new visits and handles loading/error states.
 *
 * Layout notes
 * - Intended to be used inside TabbedResourcePanel or another fixed-height flex container.
 * - The root uses min-h-0 and the list is wrapped in a flex-1 overflow-y-auto div so the list
 *   can scroll while the bottom button remains visible.
 *
 * @param {number} [unitId] - The ID of the unit to fetch visits for. If not provided, fetches all visits.
 * @param {Function} [onScheduleVisit] - Callback function called when the schedule visit button is clicked.
 * @param {string} [scheduleButtonTestId='btn-schedule-visit'] - Test ID for the schedule visit button.
 * @param {string} [containerClassName=''] - Additional CSS classes to apply to the container div.
 * @returns {JSX.Element} The rendered VisitPanel component
 */
function VisitPanel({
    unitId,
    onScheduleVisit,
    scheduleButtonTestId = "btn-schedule-visit",
    containerClassName = "",
}: VisitPanelProps) {
    const {
        data: visits,
        isLoading,
        error,
    } = useListVisitsQuery(unitId ? { unit: unitId } : undefined);

    if (isLoading) {
        return (
            <div className={containerClassName}>
                <Spinner md />
            </div>
        );
    }

    if (error) {
        return (
            <div className={containerClassName}>
                <ErrorDisplay
                    title="Erro ao carregar visitas"
                    message="Não foi possível carregar a lista de visitas. Tente novamente."
                />
            </div>
        );
    }

    return (
        <div className={clsx("flex flex-col gap-6 h-full min-h-0", containerClassName)}>
            <div className="flex-1 overflow-y-auto [scrollbar-gutter:stable] pr-2">
                <VisitList visits={visits || []} />
            </div>

            <Button onClick={onScheduleVisit} data-testid={scheduleButtonTestId}>
                Agendar visita
            </Button>
        </div>
    );
}

export default VisitPanel;
