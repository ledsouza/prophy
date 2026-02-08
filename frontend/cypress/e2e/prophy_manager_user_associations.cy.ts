describe("prophy manager - user associations", () => {
    before(() => {
        cy.setupDB();
    });

    const TOAST_TIMEOUT_MS = 10_000;

    it("allows GP to associate a non-GU user to a client and remove it", () => {
        cy.loginAs("admin_user");

        cy.intercept("GET", "**/api/users/manage/**/associations/").as("getAssociations");
        cy.intercept("POST", "**/api/clients/*/users/").as("addClientAssociation");
        cy.intercept("DELETE", "**/api/clients/*/users/*/").as("removeClientAssociation");
        cy.intercept("GET", "**/api/clients/**").as("listAllClients");

        cy.visit("/dashboard/users", { failOnStatusCode: false });
        cy.location("pathname").should("include", "/dashboard/users");

        cy.getByCy("gp-users-results")
            .find("tr")
            .then(($rows) => {
                expect($rows.length).to.be.greaterThan(1);
            });

        cy.getByCy("gp-users-results")
            .find("tr[data-cy^='gp-users-row-']")
            .first()
            .within(() => {
                cy.get("[data-cy^='gp-users-associations-']").click();
            });

        cy.getByCy("gp-users-associations-modal").should("exist");
        cy.wait("@listAllClients");
        cy.wait("@getAssociations");

        cy.getByCy("gp-users-associations-combobox-input").type("a");
        cy.getByCy("gp-users-associations-combobox-options").should("be.visible");
        cy.getByCy("gp-users-associations-combobox-options")
            .find("[data-cy^='gp-users-associations-combobox-option-']")
            .first()
            .invoke("text")
            .then((text) => text.trim())
            .as("selectedClientName");

        cy.getByCy("gp-users-associations-combobox-options")
            .find("[data-cy^='gp-users-associations-combobox-option-']")
            .first()
            .click();

        cy.getByCy("gp-users-associations-add").should("not.be.disabled");

        cy.getByCy("gp-users-associations-add").click();
        cy.wait("@addClientAssociation");

        cy.contains("Cliente associado com sucesso.", { timeout: TOAST_TIMEOUT_MS }).should(
            "be.visible",
        );

        cy.getByCy("gp-users-associations-combobox-input").clear().type("a");
        cy.getByCy("gp-users-associations-combobox-options").should("be.visible");
        cy.get("@selectedClientName").then((clientName) => {
            const name = String(clientName);
            cy.getByCy("gp-users-associations-combobox-options")
                .contains("[data-cy^='gp-users-associations-combobox-option-']", name)
                .click();
        });

        cy.getByCy("gp-users-associations-add").should("not.be.disabled");
        cy.getByCy("gp-users-associations-add").click();
        cy.contains("Usuário já está associado a este cliente.", {
            timeout: TOAST_TIMEOUT_MS,
        }).should("be.visible");

        cy.getByCy("gp-users-associations-modal")
            .find("[data-cy^='gp-users-associations-remove-client-']")
            .first()
            .click();

        cy.wait("@removeClientAssociation");

        cy.contains("Cliente removido com sucesso.", { timeout: TOAST_TIMEOUT_MS }).should(
            "be.visible",
        );

        cy.getByCy("gp-users-associations-close").click();
    });

    it("allows GP to assign and unassign a GU to a unit", () => {
        cy.loginAs("admin_user");

        cy.intercept("GET", "**/api/users/manage/**/associations/").as("getAssociations");
        cy.intercept("PUT", "**/api/units/*/unit-manager/").as("assignUnitManager");
        cy.intercept("GET", "**/api/units/**").as("listAllUnits");

        cy.visit("/dashboard/users", { failOnStatusCode: false });
        cy.location("pathname").should("include", "/dashboard/users");

        cy.getByCy("gp-users-results")
            .contains("Gerente de Unidade")
            .closest("tr")
            .within(() => {
                cy.get("[data-cy^='gp-users-associations-']").click();
            });

        cy.getByCy("gp-users-associations-modal").should("exist");
        cy.wait("@listAllUnits");
        cy.wait("@getAssociations");

        cy.getByCy("gp-users-associations-modal")
            .find("[data-cy^='gp-users-associations-unassign-unit-']")
            .then(($buttons) => {
                const associated = [...$buttons]
                    .map((button) => {
                        const row = button.closest("div");
                        const name = row?.querySelector("p")?.textContent?.trim();
                        return name || null;
                    })
                    .filter((name): name is string => Boolean(name));

                cy.wrap(associated as string[]).as("associatedUnits");
            });

        cy.getByCy("gp-users-associations-unit-combobox-input").type("a");
        cy.getByCy("gp-users-associations-unit-combobox-options").should("be.visible");
        cy.get("@associatedUnits").then((associatedUnits) => {
            const associated = Array.isArray(associatedUnits)
                ? (associatedUnits as string[])
                : ([] as string[]);
            cy.getByCy("gp-users-associations-unit-combobox-options")
                .find("[data-cy^='gp-users-associations-unit-combobox-option-']")
                .filter((_index, option) => {
                    const name = option.textContent?.trim() ?? "";
                    return Boolean(name) && !associated.includes(name);
                })
                .first()
                .invoke("text")
                .then((text) => text.trim())
                .as("selectedUnitName");

            cy.getByCy("gp-users-associations-unit-combobox-options")
                .find("[data-cy^='gp-users-associations-unit-combobox-option-']")
                .filter((_index, option) => {
                    const name = option.textContent?.trim() ?? "";
                    return Boolean(name) && !associated.includes(name);
                })
                .first()
                .click();
        });

        cy.getByCy("gp-users-associations-assign").should("not.be.disabled");

        cy.getByCy("gp-users-associations-assign").click();
        cy.wait("@assignUnitManager");

        cy.contains("Unidade atribuída com sucesso.", { timeout: TOAST_TIMEOUT_MS }).should(
            "be.visible",
        );

        cy.getByCy("gp-users-associations-unit-combobox-input").clear().type("a");
        cy.getByCy("gp-users-associations-unit-combobox-options").should("be.visible");
        cy.get("@selectedUnitName").then((unitName) => {
            const name = String(unitName);
            cy.getByCy("gp-users-associations-unit-combobox-options")
                .contains("[data-cy^='gp-users-associations-unit-combobox-option-']", name)
                .click();
        });

        cy.getByCy("gp-users-associations-assign").should("not.be.disabled");
        cy.getByCy("gp-users-associations-assign").click();
        cy.contains("Usuário já está associado a esta unidade.", {
            timeout: TOAST_TIMEOUT_MS,
        }).should("be.visible");

        cy.getByCy("gp-users-associations-unit-combobox-input").clear().type("a");
        cy.getByCy("gp-users-associations-unit-combobox-options").should("be.visible");
        cy.get("@associatedUnits").then((associatedUnits) => {
            const associated = Array.isArray(associatedUnits)
                ? (associatedUnits as string[])
                : ([] as string[]);
            const fallbackUnit = associated[0];

            if (fallbackUnit) {
                cy.getByCy("gp-users-associations-unit-combobox-options")
                    .contains(
                        "[data-cy^='gp-users-associations-unit-combobox-option-']",
                        fallbackUnit,
                    )
                    .click();
            }
        });

        cy.getByCy("gp-users-associations-assign").should("not.be.disabled");

        cy.getByCy("gp-users-associations-assign").click();
        cy.contains("Usuário já está associado a esta unidade.", {
            timeout: TOAST_TIMEOUT_MS,
        }).should("be.visible");

        cy.getByCy("gp-users-associations-modal")
            .find("[data-cy^='gp-users-associations-unassign-unit-']")
            .first()
            .click();

        cy.wait("@assignUnitManager");

        cy.contains("Unidade desassociada com sucesso.", { timeout: TOAST_TIMEOUT_MS }).should(
            "be.visible",
        );

        cy.getByCy("gp-users-associations-close").click();
    });
});
