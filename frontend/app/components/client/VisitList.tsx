"use client";

import { VisitCard } from "@/components/client";
import { Typography } from "@/components/foundation";
import type { VisitDTO } from "@/types/visit";

type VisitListProps = {
    visits: VisitDTO[];
    emptyStateMessage?: string;
};

function VisitList({ visits, emptyStateMessage = "Nenhuma visita agendada" }: VisitListProps) {
    if (!visits || visits.length === 0) {
        return (
            <Typography
                element="p"
                size="lg"
                dataTestId="visit-not-found"
                className="justify-center text-center"
            >
                {emptyStateMessage}
            </Typography>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {visits.map((v) => (
                <VisitCard key={v.id} visit={v} />
            ))}
        </div>
    );
}

export default VisitList;
