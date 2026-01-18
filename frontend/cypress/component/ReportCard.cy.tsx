import ReportCard from "@/components/client/ReportCard";
import type { ReportDTO } from "@/types/report";

const baseReport: ReportDTO = {
    id: 123,
    report_type: "M",
    completion_date: "2020-01-01",
    due_date: "2021-01-01",
    status: "overdue",
    unit: 1,
    equipment: null,
    file: "https://example.com/report.pdf",
    is_deleted: false,
};

describe("ReportCard", () => {
    it("renders the status badge for an active report", () => {
        cy.mount(<ReportCard report={baseReport} />);

        cy.get('[data-testid="report-status-badge"]').should("be.visible");
        cy.get('[data-testid="report-status-badge"]').should("contain.text", "Vencido");
    });

    it("renders the status badge for an archived report", () => {
        const archivedReport: ReportDTO = {
            ...baseReport,
            status: "archived",
            is_deleted: true,
        };

        cy.mount(<ReportCard report={archivedReport} />);

        cy.get('[data-testid="report-status-badge"]').should("be.visible");
        cy.get('[data-testid="report-status-badge"]').should("contain.text", "Arquivado");
    });

    it("renders the status badge for a due soon report", () => {
        const dueSoonReport: ReportDTO = {
            ...baseReport,
            status: "due_soon",
        };

        cy.mount(<ReportCard report={dueSoonReport} />);

        cy.get('[data-testid="report-status-badge"]').should("be.visible");
        cy.get('[data-testid="report-status-badge"]').should("have.class", "whitespace-nowrap");
        cy.get('[data-testid="report-status-badge"]').should("contain.text", "Vence em breve");
    });
});
