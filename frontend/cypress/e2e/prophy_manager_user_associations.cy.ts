import {
    DESKTOP_VIEWPORT,
    MOBILE_VIEWPORT,
    describeForViewports,
    visitDashboardAs,
} from "../support/e2eTestUtils";

describe("prophy manager - user associations", () => {
    type ClientFixture = {
        id: number;
        name: string;
    };

    type UnitFixture = {
        client: number;
        name: string;
        user: number | null;
    };

    beforeEach(() => {
        cy.setupDB();
    });

    describeForViewports([DESKTOP_VIEWPORT, MOBILE_VIEWPORT], (viewport) => {
        it("allows GP to associate a non-GU user to a client and remove it", () => {
            cy.intercept("GET", "**/api/users/manage/**/associations/").as("getAssociations");
            cy.intercept("POST", "**/api/clients/*/users/").as("addClientAssociation");
            cy.intercept("DELETE", "**/api/clients/*/users/*/").as("removeClientAssociation");
            cy.intercept("GET", "**/api/clients/**").as("listAllClients");

            visitDashboardAs("admin_user", "/dashboard/users");
            cy.location("pathname").should("include", "/dashboard/users");

            if (viewport.isMobile) {
                cy.getByCy("gp-users-results")
                    .find("[data-cy^='gp-users-card-']")
                    .first()
                    .within(() => {
                        cy.get("[data-cy^='gp-users-associations-']").click();
                    });
            } else {
                cy.getByCy("gp-users-results")
                    .find("tr[data-cy^='gp-users-row-']")
                    .first()
                    .within(() => {
                        cy.get("[data-cy^='gp-users-associations-']")
                            .scrollIntoView()
                            .click();
                    });
            }

            cy.getByCy("gp-users-associations-modal").should("exist");
            cy.wait("@listAllClients");
            cy.wait("@getAssociations");

            cy.getByCy("gp-users-associations-modal")
                .find("[data-cy^='gp-users-associations-remove-client-']")
                .then(($buttons) => {
                    const associated = [...$buttons]
                        .map((button) => {
                            const row = button.closest("div");
                            const name = row?.querySelector("p")?.textContent?.trim();
                            return name || null;
                        })
                        .filter((name): name is string => Boolean(name));

                    cy.wrap(associated as string[]).as("associatedClients");
                });

            cy.getByCy("gp-users-associations-combobox-input").type("a");
            cy.getByCy("gp-users-associations-combobox-options").should("be.visible");
            cy.getByCy("gp-users-associations-combobox-options")
                .find("[data-cy^='gp-users-associations-combobox-option-']")
                .then(($options) => {
                    const options = [...$options].map((option) => {
                        return option.textContent?.trim() ?? "";
                    });

                    cy.get("@associatedClients").then((associatedClients) => {
                        const associated = Array.isArray(associatedClients)
                            ? (associatedClients as string[])
                            : ([] as string[]);
                        const available = options.filter(
                            (name) => name && !associated.includes(name),
                        );

                        if (!available.length) {
                            throw new Error("No available client to associate");
                        }

                        const selectedName = available[0];
                        cy.wrap(selectedName).as("selectedClientName");
                        cy.getByCy("gp-users-associations-combobox-options")
                            .contains(
                                "[data-cy^='gp-users-associations-combobox-option-']",
                                selectedName,
                            )
                            .click();
                    });
                });

            cy.getByCy("gp-users-associations-add").should("not.be.disabled");
            cy.getByCy("gp-users-associations-add").click();
            cy.wait("@addClientAssociation");
            cy.get("@selectedClientName").then((clientName) => {
                cy.getByCy("gp-users-associations-modal").should(
                    "contain",
                    String(clientName),
                );
            });

            cy.getByCy("gp-users-associations-combobox-input").clear().type("a");
            cy.getByCy("gp-users-associations-combobox-options").should("be.visible");
            cy.get("@selectedClientName").then((clientName) => {
                const name = String(clientName);
                cy.getByCy("gp-users-associations-combobox-options")
                    .contains("[data-cy^='gp-users-associations-combobox-option-']", name)
                    .click();
            });

            cy.getByCy("gp-users-associations-modal")
                .find("[data-cy^='gp-users-associations-remove-client-']")
                .then(($buttons) => {
                    cy.wrap($buttons.length).as("clientAssociationCount");
                });

            cy.getByCy("gp-users-associations-add").should("not.be.disabled");
            cy.getByCy("gp-users-associations-add").click();
            cy.get("@clientAssociationCount").then((count) => {
                cy.getByCy("gp-users-associations-modal")
                    .find("[data-cy^='gp-users-associations-remove-client-']")
                    .should("have.length", Number(count));
            });

            cy.get("@selectedClientName").then((clientName) => {
                cy.getByCy("gp-users-associations-modal")
                    .contains(String(clientName))
                    .parents("div")
                    .filter((_, el) => {
                        return el.querySelector("button") !== null;
                    })
                    .first()
                    .within(() => {
                        cy.contains("Desassociar").click();
                    });
            });

            cy.wait("@removeClientAssociation");

            cy.get("@selectedClientName").then((clientName) => {
                cy.getByCy("gp-users-associations-modal")
                    .contains(String(clientName))
                    .should("not.exist");
            });

            cy.getByCy("gp-users-associations-close").click();
        });

        it("allows GP to assign and unassign a GU to a unit", () => {
            cy.intercept("GET", "**/api/users/manage/**").as("listManagedUsers");
            cy.intercept("GET", "**/api/users/manage/**/associations/").as("getAssociations");
            cy.intercept("PUT", "**/api/units/*/unit-manager/").as("assignUnitManager");
            cy.intercept("GET", "**/api/units/**").as("listAllUnits");
            cy.intercept("GET", "**/api/clients/**").as("listAllClients");

            visitDashboardAs("admin_user", "/dashboard/users");
            cy.location("pathname").should("include", "/dashboard/users");

            cy.fixture("users.json").then((usersFixture) => {
                const guUserName = String(usersFixture.unit_manager_user.name);

                cy.getByCy("gp-users-filter-name").clear().type(guUserName);
                cy.wait("@listManagedUsers");

                if (viewport.isMobile) {
                    cy.getByCy("gp-users-card-1002").within(() => {
                        cy.get("[data-cy^='gp-users-associations-']").click();
                    });
                } else {
                    cy.getByCy("gp-users-row-1002").within(() => {
                        cy.get("[data-cy^='gp-users-associations-']")
                            .scrollIntoView()
                            .click();
                    });
                }
            });

            cy.getByCy("gp-users-associations-modal").should("exist");
            cy.wait("@listAllClients");
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

            cy.fixture("default-clients.json").then((clientsFixture) => {
                const typedClients = clientsFixture as Record<string, ClientFixture>;

                cy.fixture("default-units.json").then((unitsFixture) => {
                    const typedUnits = unitsFixture as Record<string, UnitFixture>;
                    const clientWithUnits = typedClients.client1;
                    const availableUnits = Object.values(typedUnits).filter((unit) => {
                        return unit.client === clientWithUnits.id && unit.user === null;
                    });

                    if (!availableUnits.length) {
                        throw new Error("No available units without manager in fixtures");
                    }

                    const selectedUnit = availableUnits[0];
                    const selectedClientName = String(clientWithUnits.name);
                    const selectedUnitName = String(selectedUnit.name);

                    cy.wrap(selectedClientName).as("selectedClientName");
                    cy.wrap(selectedUnitName).as("selectedUnitName");

                    cy.getByCy("gp-users-associations-client-combobox-input").type(
                        selectedClientName,
                    );
                    cy.getByCy("gp-users-associations-client-combobox-options").should(
                        "be.visible",
                    );
                    cy.getByCy("gp-users-associations-client-combobox-options")
                        .contains(
                            "[data-cy^='gp-users-associations-client-combobox-option-']",
                            selectedClientName,
                        )
                        .click();

                    cy.getByCy("gp-users-associations-unit-select").find("button").click();
                    cy.getByCy("gp-users-associations-unit-select-options").should(
                        "be.visible",
                    );
                    cy.getByCy("gp-users-associations-unit-select-options")
                        .find("[role='option']")
                        .contains(selectedUnitName)
                        .click();
                });
            });

            cy.getByCy("gp-users-associations-assign").should("not.be.disabled");

            cy.getByCy("gp-users-associations-assign").click();
            cy.wait("@assignUnitManager");
            cy.get("@selectedUnitName").then((unitName) => {
                cy.getByCy("gp-users-associations-modal").should("contain", String(unitName));
            });

            cy.get("@selectedUnitName").then((unitName) => {
                cy.getByCy("gp-users-associations-modal")
                    .contains(String(unitName))
                    .parents("div")
                    .filter((_, el) => {
                        return el.querySelector("button") !== null;
                    })
                    .first()
                    .within(() => {
                        cy.contains("Desassociar").click();
                    });
            });

            cy.wait("@assignUnitManager");
            cy.get("@selectedUnitName").then((unitName) => {
                cy.getByCy("gp-users-associations-modal")
                    .contains(String(unitName))
                    .should("not.exist");
            });

            cy.getByCy("gp-users-associations-close").click();
        });
    });
});
