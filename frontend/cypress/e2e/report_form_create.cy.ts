import {
    DESKTOP_VIEWPORT,
    MOBILE_VIEWPORT,
    describeForViewports,
    visitDashboardAs,
} from "../support/e2eTestUtils";

function openCreateReportForm(): void {
    visitDashboardAs("admin_user");
    cy.visit("/dashboard/unit/1000");
    cy.getByCy("tab-reports").click();
    cy.get('[data-testid="btn-create-report"]').click();
}

function fillReportFiles(): void {
    cy.get('[data-testid="report-pdf-file-input"]').selectFile(
        {
            contents: Cypress.Buffer.from("%PDF-1.4 fake content"),
            fileName: "report.pdf",
            mimeType: "application/pdf",
        },
        { force: true },
    );
    cy.get('[data-testid="report-word-file-input"]').selectFile(
        {
            contents: Cypress.Buffer.from("docx fake content"),
            fileName: "report.docx",
            mimeType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
        { force: true },
    );
}

describe("report form - create", () => {
    before(() => {
        cy.setupDB();
    });

    describeForViewports([DESKTOP_VIEWPORT, MOBILE_VIEWPORT], () => {
        it("creates a report with a description and displays it in the report card", () => {
            openCreateReportForm();

            cy.get('[data-testid="report-type-select"]').find("button").click();
            cy.contains('[role="option"]', "Ato de designação").click();

            fillReportFiles();

            const description = "Relatório de teste E2E.";
            cy.get('[data-cy="report-description-textarea"]').type(description);

            cy.get('[data-testid="btn-report-create-submit"]').click();

            cy.contains("Relatório criado com sucesso.", { timeout: 10000 }).should(
                "be.visible",
            );
            cy.contains('[data-testid="report-description"]', description, {
                timeout: 10000,
            }).should("exist");
        });

        it("shows a validation error when description is left blank", () => {
            openCreateReportForm();

            fillReportFiles();

            cy.get('[data-testid="btn-report-create-submit"]').click();

            cy.contains('[data-testid="validation-error"]', "Descrição é obrigatória.").should(
                "be.visible",
            );
            cy.contains("Relatório criado com sucesso.").should("not.exist");
        });
    });
});
