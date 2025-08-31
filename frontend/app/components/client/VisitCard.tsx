"use client";

import { Typography } from "@/components/foundation";
import { visitStatusLabel } from "@/enums/VisitStatus";
import type { VisitDTO } from "@/redux/features/visitApiSlice";
import { formatPhoneNumber } from "@/utils/format";
import clsx from "clsx";
import { format, parseISO } from "date-fns";

type VisitCardProps = {
    visit: VisitDTO;
    dataTestId?: string;
};

/**
 * VisitCard component for displaying visit information in a card format.
 *
 * This component renders a card showing visit details including the formatted date,
 * visit status, contact name, and formatted phone number.
 *
 * @param {VisitDTO} visit - The visit data object containing date, status, contact info, etc.
 * @param {string} [dataTestId] - Optional test ID for the card element. Defaults to `visit-card-${visit.id}`.
 * @returns {JSX.Element} The rendered VisitCard component
 */
function VisitCard({ visit, dataTestId }: VisitCardProps) {
    const dateLabel = (() => {
        try {
            const d = parseISO(visit.date);
            return format(d, "dd/MM/yyyy HH:mm");
        } catch {
            return visit.date;
        }
    })();

    return (
        <div
            className={clsx(
                "bg-light rounded-xl shadow-sm p-6 ring-1",
                "ring-inset ring-gray-200 hover:ring-primary"
            )}
            data-testid={dataTestId || `visit-card-${visit.id}`}
        >
            <div className="flex justify-between pb-4">
                <div className="flex flex-col">
                    <Typography element="h3" size="title3">
                        {dateLabel}
                    </Typography>
                    <Typography element="p" size="lg">
                        {visitStatusLabel[visit.status]}
                    </Typography>
                </div>

                <div className="text-right">
                    <Typography element="p" size="sm">
                        Contato
                    </Typography>
                    <Typography element="p" size="md">
                        {visit.contact_name}
                    </Typography>
                    <Typography element="p" size="md">
                        {formatPhoneNumber(visit.contact_phone)}
                    </Typography>
                </div>
            </div>
        </div>
    );
}

export default VisitCard;
