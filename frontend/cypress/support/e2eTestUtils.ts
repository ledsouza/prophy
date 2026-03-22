import type { RoleUser } from "./roleUsers";

export type SupportedViewport = Cypress.ViewportPreset | [number, number];

export type ViewportConfig = {
    name: string;
    value: SupportedViewport;
    isMobile: boolean;
};

export const DESKTOP_VIEWPORT: ViewportConfig = {
    name: "desktop",
    value: [1280, 720],
    isMobile: false,
};

export const MOBILE_VIEWPORT: ViewportConfig = {
    name: "mobile",
    value: "iphone-6",
    isMobile: true,
};

export function applyViewport(viewport: SupportedViewport): void {
    if (Array.isArray(viewport)) {
        cy.viewport(viewport[0], viewport[1]);
        return;
    }

    cy.viewport(viewport);
}

export function describeForViewports(
    viewports: ViewportConfig[],
    suite: (viewport: ViewportConfig) => void,
): void {
    viewports.forEach((viewport) => {
        describe(`viewport ${viewport.name}`, () => {
            beforeEach(() => {
                applyViewport(viewport.value);
            });

            suite(viewport);
        });
    });
}

export function visitDashboardAs(user: RoleUser, path = "/dashboard"): void {
    cy.loginAs(user);
    cy.visit(path);
}