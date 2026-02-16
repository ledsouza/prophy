describe("Responsive layout shell", () => {
    const iphoneViewport: [number, number] = [390, 844];

    beforeEach(() => {
        cy.setupDB();
        cy.viewport(iphoneViewport[0], iphoneViewport[1]);
        cy.loginAs("admin_user");
    });

    it("keeps the app shell within the viewport without horizontal scroll", () => {
        cy.visit("/dashboard");

        cy.getByCy("app-shell").should("be.visible");

        cy.window().then((win) => {
            const root = win.document.documentElement;
            expect(root.scrollWidth).to.be.at.most(root.clientWidth);
        });
    });

    it("renders the tabbed resource panel without internal scroll traps", () => {
        cy.visit("/dashboard/unit/1000/");

        cy.get('[data-cy="tabbed-resource-panel"]', { timeout: 10000 }).should("be.visible");

        cy.window().then((win) => {
            const root = win.document.documentElement;
            expect(root.scrollWidth).to.be.at.most(root.clientWidth);
        });
    });
});
