"use client";

import { VisitList } from "@/components/client";
import { Button, ErrorDisplay, Spinner } from "@/components/common";
import { Typography } from "@/components/foundation";
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
 * This component fetches visits using the useListVisitsQuery hook and displays them
 * in a VisitList component. It also provides a button to schedule new visits.
 * Handles loading and error states appropriately.
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
        <div
            className={clsx(
                "w-full md:w-2/3 h-[60vh] md:h-[80vh]",
                "overflow-y-auto flex flex-col gap-6",
                "bg-white rounded-xl shadow-lg",
                "p-6 md:p-8",
                containerClassName
            )}
        >
            <Typography element="h2" size="title2" className="font-bold">
                Visitas
            </Typography>

            <VisitList visits={visits || []} />

            <Button onClick={onScheduleVisit} data-testid={scheduleButtonTestId}>
                Agendar visita
            </Button>
        </div>
    );
}

export default VisitPanel;
