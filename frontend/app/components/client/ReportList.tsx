"use client";

import { ReportCard } from "@/components/client";
import { Typography } from "@/components/foundation";
import type { ReportDTO } from "@/types/report";

type ReportListProps = {
    reports: ReportDTO[];
    emptyStateMessage?: string;
};

/**
 * ReportList
 *
 * Displays a list of reports using ReportCard components.
 * Shows an empty state message when no reports are available.
 */
function ReportList({
    reports,
    emptyStateMessage = "Nenhum relatório disponível",
}: ReportListProps) {
    if (!reports || reports.length === 0) {
        return (
            <Typography
                element="p"
                size="lg"
                dataTestId="report-not-found"
                className="justify-center text-center"
            >
                {emptyStateMessage}
            </Typography>
        );
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            {reports.map((report) => (
                <ReportCard
                    key={report.id}
                    report={report}
                    dataTestId={`report-card-${report.id}`}
                />
            ))}
        </div>
    );
}

export default ReportList;
