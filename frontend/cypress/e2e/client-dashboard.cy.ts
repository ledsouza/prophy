import { formatPhoneNumber } from "@/utils/format";

describe("Client dashboard", () => {
    context("Rendering", () => {
        it("should display the client details", () => {
            cy.visit("/auth/login");
            cy.fixture("users.json").then((users) => {
                cy.login(users.client_user.cpf, users.client_user.password);
            });

            cy.getByTestId("client-header").should("be.visible");
            cy.getByTestId("client-options").should("be.visible");
            cy.getByTestId("client-details").should("be.visible");
            cy.getByTestId("gerente-prophy").should("be.visible");
            cy.getByTestId("comercial-header").should("be.visible");
            cy.getByTestId("comercial-details").should("be.visible");
            cy.getByTestId("invoice-header").should("be.visible");
            cy.getByTestId("invoice-nf").should("be.visible");
            cy.getByTestId("invoice-emission").should("be.visible");
            cy.getByTestId("invoice-btn-details").should("be.visible");
        });

        it("should display a list of units", () => {
            cy.visit("/auth/login");
            cy.fixture("users.json").then((users) => {
                cy.login(users.client_user.cpf, users.client_user.password);
            });

            cy.fixture("default-units.json").then((units) => {
                cy.getByTestId(`unit-card-${units.unit1.id}`).should(
                    "be.visible"
                );
                cy.getByTestId("equipments-counts")
                    .should("be.visible")
                    .and("contain", "Quantidade de Equipamentos: 1");
            });
            cy.getByTestId("btn-add-equipment").should("be.visible");
            cy.getByTestId("btn-add-unit")
                .scrollIntoView()
                .should("be.visible");
        });

        context("API Retuns Empty Data", () => {
            it("should display a user friendly page when no clients are available", () => {
                cy.intercept(
                    "GET",
                    "http://localhost:8000/api/clients/?page=1",
                    {
                        statusCode: 200,
                        body: {
                            count: 0,
                            next: null,
                            previous: null,
                            results: [],
                        },
                    }
                ).as("getClients");

                cy.visit("/auth/login");
                cy.fixture("users.json").then((users) => {
                    cy.login(users.client_user.cpf, users.client_user.password);
                });

                cy.wait("@getClients");

                cy.getByTestId("data-not-found").should("be.visible");
                cy.getByTestId("btn-refresh").should("be.visible");
            });

            it("should display a user friendly page when no units are available", () => {
                cy.intercept("GET", "http://localhost:8000/api/units/?page=1", {
                    statusCode: 200,
                    body: {
                        count: 0,
                        next: null,
                        previous: null,
                        results: [],
                    },
                }).as("getUnits");

                cy.visit("/auth/login");
                cy.fixture("users.json").then((users) => {
                    cy.login(users.client_user.cpf, users.client_user.password);
                });

                cy.wait("@getUnits");

                cy.getByTestId("unit-not-found").should("be.visible");
            });
        });
    });

    context("Filtering", () => {
        beforeEach(() => {
            cy.visit("/auth/login");
            cy.fixture("users.json").then((users) => {
                cy.login(users.client_user.cpf, users.client_user.password);
            });
        });

        it("should filter the default client details", () => {
            cy.fixture("default-clients.json").then((clients) => {
                cy.getByTestId("client-options").should(
                    "contain",
                    clients.client1.name
                );
                cy.getByTestId("client-details")
                    .should("contain", "(51) 3359 - 6100")
                    .and("contain", clients.client1.email);
                cy.getByTestId("client-details-address").should(
                    "contain",
                    clients.client1.address
                );
            });

            cy.fixture("users.json").then((users) => {
                cy.getByTestId("gerente-prophy").should(
                    "contain",
                    users.admin_user.name
                );
                cy.getByTestId("gerente-prophy").should(
                    "contain",
                    formatPhoneNumber(users.admin_user.phone)
                );
                cy.getByTestId("gerente-prophy").should(
                    "contain",
                    users.admin_user.email
                );
            });

            cy.fixture("default-units.json").then((units) => {
                cy.getByTestId(`unit-card-${units.unit1.id}`).should(
                    "contain",
                    units.unit1.name
                );
                cy.getByTestId("equipments-counts")
                    .should("be.visible")
                    .and("contain", "Quantidade de Equipamentos: 1");
            });
        });

        it("should filter client details by selecting an option", () => {
            cy.fixture("default-clients.json").then((clients) => {
                cy.getByTestId("client-options").find("button").click();
                cy.get('[role="listbox"]').should("be.visible");
                cy.get('[role="option"]')
                    .contains(clients.client2.name)
                    .click();

                cy.getByTestId("client-options").should(
                    "contain",
                    clients.client2.name
                );
                cy.getByTestId("client-details")
                    .should("contain", "(51) 3214 - 8000")
                    .and("contain", clients.client2.email);
                cy.getByTestId("client-details-address").should(
                    "contain",
                    clients.client2.address
                );
            });

            cy.fixture("default-units.json").then((units) => {
                cy.getByTestId(`unit-card-${units.unit2.id}`).should(
                    "contain",
                    units.unit2.name
                );
                cy.getByTestId("equipments-counts")
                    .should("be.visible")
                    .and("contain", "Quantidade de Equipamentos: 1");
            });
        });
    });
});
