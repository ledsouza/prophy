import { formatPhoneNumber } from "@/utils/format";
import { mask as cnpjMask } from "validation-br/dist/cnpj";

const apiUrl = Cypress.env("apiUrl");

describe("Client dashboard", () => {
    beforeEach(() => {
        cy.visit("/auth/login");
        cy.fixture("users.json").then((users) => {
            cy.login(users.client_user.cpf, users.client_user.password);
        });
    });

    context(
        "when Gerente Prophy is the responsable medical physicist and comercial manager",
        () => {
            it("should display the client details", () => {
                cy.getByTestId("client-header").should("be.visible");
                cy.getByTestId("client-options").should("be.visible");

                cy.fixture("default-clients.json").then((clients) => {
                    cy.getByTestId("client-details")
                        .should("contain", cnpjMask(clients.client1.cnpj))
                        .should(
                            "contain",
                            formatPhoneNumber(clients.client1.phone)
                        )
                        .should("contain", clients.client1.email)
                        .should("contain", clients.client1.address);
                });
            });

            it("should display the responsable medical physicist as Gerente Prophy", () => {
                cy.getByTestId("responsable-medical-physicist-header").should(
                    "be.visible"
                );

                cy.fixture("users.json").then((users) => {
                    cy.getByTestId("gerente-prophy")
                        .should("contain", users.admin_user.name)
                        .should(
                            "contain",
                            formatPhoneNumber(users.admin_user.phone)
                        )
                        .should("contain", users.admin_user.email);
                });
            });

            it("should display the comercial manager as Gerente Prophy", () => {
                cy.getByTestId("comercial-header").should("be.visible");

                cy.fixture("users.json").then((users) => {
                    cy.getByTestId("comercial-details")
                        .should("contain", users.admin_user.name)
                        .should(
                            "contain",
                            formatPhoneNumber(users.admin_user.phone)
                        )
                        .should("contain", users.admin_user.email);
                });
            });
        }
    );

    context(
        "when there is more than one responsable medical physicist and one comercial manager",
        () => {
            beforeEach(() => {
                cy.fixture("default-clients.json").then((clients) => {
                    cy.getByTestId("client-options").find("button").click();
                    cy.get('[role="listbox"]').should("be.visible");
                    cy.get('[role="option"]')
                        .contains(clients.client2.name)
                        .click();
                });
            });

            it("should display the client details", () => {
                cy.getByTestId("client-header").should("be.visible");
                cy.getByTestId("client-options").should("be.visible");

                cy.fixture("default-clients.json").then((clients) => {
                    cy.getByTestId("client-details")
                        .should("contain", cnpjMask(clients.client2.cnpj))
                        .should(
                            "contain",
                            formatPhoneNumber(clients.client2.phone)
                        )
                        .should("contain", clients.client2.email)
                        .should("contain", clients.client2.address);
                });
            });

            it("should display the responsable medical physicist as Gerente Prophy and external medical physicist", () => {
                cy.getByTestId("responsable-medical-physicist-header").should(
                    "be.visible"
                );

                cy.fixture("users.json").then((users) => {
                    cy.getByTestId("gerente-prophy")
                        .should("contain", users.admin_user.name)
                        .should(
                            "contain",
                            formatPhoneNumber(users.admin_user.phone)
                        )
                        .should("contain", users.admin_user.email);
                });

                cy.fixture("users.json").then((users) => {
                    cy.getByTestId("fisico-medico-externo")
                        .should("contain", users.external_physicist_user.name)
                        .should(
                            "contain",
                            formatPhoneNumber(
                                users.external_physicist_user.phone
                            )
                        )
                        .should("contain", users.external_physicist_user.email);
                });
            });

            it("should display the comercial manager as comercial user", () => {
                cy.getByTestId("comercial-header").should("be.visible");

                cy.fixture("users.json").then((users) => {
                    cy.getByTestId("comercial-details")
                        .should("contain", users.comercial_user.name)
                        .should(
                            "contain",
                            formatPhoneNumber(users.comercial_user.phone)
                        )
                        .should("contain", users.comercial_user.email);
                });
            });
        }
    );

    context(
        "when there is no reponsable medical physicist or comercial manager",
        () => {
            beforeEach(() => {
                cy.fixture("default-clients.json").then((clients) => {
                    cy.getByTestId("client-options").find("button").click();
                    cy.get('[role="listbox"]').should("be.visible");
                    cy.get('[role="option"]')
                        .contains(clients.client_empty.name)
                        .click();
                });
            });

            it("should display the client details", () => {
                cy.getByTestId("client-header").should("be.visible");
                cy.getByTestId("client-options").should("be.visible");

                cy.fixture("default-clients.json").then((clients) => {
                    cy.getByTestId("client-details")
                        .should("contain", cnpjMask(clients.client_empty.cnpj))
                        .should(
                            "contain",
                            formatPhoneNumber(clients.client_empty.phone)
                        )
                        .should("contain", clients.client_empty.email)
                        .should("contain", clients.client_empty.address);
                });
            });

            it("should display a message about no responsable medical physicist associated", () => {
                cy.getByTestId("responsable-medical-physicist-header").should(
                    "be.visible"
                );

                cy.getByTestId("empty-responsable-medical-physicist").should(
                    "contain",
                    "Designaremos um físico médico para esta instituição e, em breve, disponibilizaremos os dados de contato do profissional responsável."
                );
            });

            it("should display a message about no comercial manager associated", () => {
                cy.getByTestId("comercial-header").should("be.visible");

                cy.getByTestId("empty-comercial").should(
                    "contain",
                    "Designaremos um gerente comercial para esta instituição e, em breve, disponibilizaremos os dados de contato do profissional responsável."
                );
            });
        }
    );

    it("should display buttons for editing or deleting a client", () => {
        cy.getByTestId("btn-edit-client").should("be.visible");
        cy.getByTestId("btn-delete-client").should("be.visible");
    });

    it("should display a list of units", () => {
        cy.fixture("default-units.json").then((units) => {
            cy.getByTestId(`unit-card-${units.unit1.id}`)
                .scrollIntoView()
                .should("be.visible")
                .and("contain", "Quantidade de Equipamentos: 2");
            cy.getByTestId(`unit-card-${units.unit2.id}`)
                .scrollIntoView()
                .should("be.visible");
            cy.getByTestId(`unit-card-${units.unit3.id}`)
                .scrollIntoView()
                .should("be.visible");
        });
    });

    it("should filter based on the search term", () => {
        cy.fixture("default-units.json").then((units) => {
            cy.getByTestId("input-search-unit").type(units.unit2.name);
            cy.getByTestId(`unit-card-${units.unit1.id}`).should("not.exist");
            cy.getByTestId(`unit-card-${units.unit2.id}`)
                .scrollIntoView()
                .should("be.visible");
            cy.getByTestId(`unit-card-${units.unit3.id}`).should("not.exist");
        });
    });

    it("should display buttons for adding, editing and deleting a unit", () => {
        cy.getByTestId("btn-add-unit").scrollIntoView().should("be.visible");
        cy.getByTestId("btn-edit-unit").should("be.visible");
        cy.getByTestId("btn-delete-unit").should("be.visible");
    });

    context("API Retuns Empty Data", () => {
        it("should display a user page when no clients are available", () => {
            cy.intercept("GET", `${apiUrl}/clients/?page=1`, {
                statusCode: 200,
                body: {
                    count: 0,
                    next: null,
                    previous: null,
                    results: [],
                },
            }).as("getClients");

            cy.visit("/auth/login");
            cy.fixture("users.json").then((users) => {
                cy.login(users.client_user.cpf, users.client_user.password);
            });

            cy.wait("@getClients");

            cy.getByTestId("data-not-found").should("be.visible");
            cy.getByTestId("btn-refresh").should("be.visible");
        });

        it("should display a user page when no units are available", () => {
            cy.intercept("GET", `${apiUrl}/units/?page=1`, {
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

describe("Unit dashboard", () => {
    beforeEach(() => {
        cy.visit("/auth/login");
        cy.fixture("users.json").then((users) => {
            cy.login(users.client_user.cpf, users.client_user.password);
        });
    });

    context("when the unit has equipments and a manager", () => {
        beforeEach(() => {
            cy.fixture("default-units.json").then((units) => {
                cy.getByTestId(`unit-card-${units.unit1.id}`).click();
                cy.url().should(
                    "contain",
                    `/dashboard/unit/${units.unit1.id}/`
                );
            });
        });

        it("should display unit details", () => {
            cy.getByTestId("unit-header").should("be.visible");

            cy.fixture("default-units.json").then((units) => {
                cy.getByTestId("unit-details")
                    .should("contain", units.unit1.name)
                    .should("contain", cnpjMask(units.unit1.cnpj))
                    .should("contain", formatPhoneNumber(units.unit1.phone))
                    .should("contain", units.unit1.email)
                    .should("contain", units.unit1.address);
            });
        });

        it("should display unit manager contact info", () => {
            cy.getByTestId("unit-manager-header").should("be.visible");

            cy.fixture("users.json").then((users) => {
                cy.getByTestId("unit-manager-user")
                    .should("contain", users.unit_manager_user.name)
                    .should(
                        "contain",
                        formatPhoneNumber(users.unit_manager_user.phone)
                    )
                    .should("contain", users.unit_manager_user.email);
            });
        });

        it("should display a list of equipments", () => {
            cy.fixture("default-equipments.json").then((equipments) => {
                cy.getByTestId(`equipment-card-${equipments.equipment1.id}`)
                    .scrollIntoView()
                    .should("be.visible")
                    .should("contain", equipments.equipment1.model)
                    .should("contain", equipments.equipment1.manufacturer)
                    .should("contain", equipments.equipment1.modality);
                cy.getByTestId(`equipment-card-${equipments.equipment2.id}`)
                    .scrollIntoView()
                    .should("be.visible")
                    .should("contain", equipments.equipment2.model)
                    .should("contain", equipments.equipment2.manufacturer)
                    .should("contain", equipments.equipment2.modality);
            });
        });
    });

    context("when the unit doesn't have equipments and a manager", () => {
        beforeEach(() => {
            cy.fixture("default-clients.json").then((clients) => {
                cy.getByTestId("client-options").find("button").click();
                cy.get('[role="listbox"]').should("be.visible");
                cy.get('[role="option"]')
                    .contains(clients.client2.name)
                    .click();
            });

            cy.fixture("default-units.json").then((units) => {
                cy.getByTestId(`unit-card-${units.unit4.id}`).click();
                cy.url().should(
                    "contain",
                    `/dashboard/unit/${units.unit4.id}/`
                );
            });
        });

        it("should display the unit details", () => {
            cy.getByTestId("unit-header").should("be.visible");

            cy.fixture("default-units.json").then((units) => {
                cy.getByTestId("unit-details")
                    .should("contain", units.unit4.name)
                    .should("contain", cnpjMask(units.unit4.cnpj))
                    .should("contain", formatPhoneNumber(units.unit4.phone))
                    .should("contain", units.unit4.email)
                    .should("contain", units.unit4.address);
            });
        });

        it("should display a message about no unit manager associated", () => {
            cy.getByTestId("empty-unit-manager-user").should(
                "contain",
                "Nenhum gerente de unidade foi designado. Deseja atribuir um agora?"
            );

            cy.getByTestId("btn-add-unit-manager").should("be.visible");
        });

        it("should display a message for empty list of equipments", () => {
            cy.getByTestId("equipment-not-found").should(
                "contain",
                "Nenhum equipamento registrado"
            );

            cy.getByTestId("btn-add-equipment").should("be.visible");
        });
    });

    context("functionality", () => {
        beforeEach(() => {
            cy.fixture("default-units.json").then((units) => {
                cy.getByTestId(`unit-card-${units.unit1.id}`).click();
                cy.url().should(
                    "contain",
                    `/dashboard/unit/${units.unit1.id}/`
                );
            });
        });

        it("should display a navigation button to go back", () => {
            cy.getByTestId("btn-go-back").should("be.visible").click();

            cy.url().should("contain", "/dashboard/");
        });

        it("should display buttons for editing or deleting an unit", () => {
            cy.getByTestId("btn-edit-unit").should("be.visible");
            cy.getByTestId("btn-delete-unit").should("be.visible");
        });

        it("should display buttons for adding, editing and deleting an equipment", () => {
            cy.getByTestId("btn-add-equipment")
                .scrollIntoView()
                .should("be.visible");
            cy.getByTestId("btn-edit-equipment").should("be.visible");
            cy.getByTestId("btn-delete-equipment").should("be.visible");
        });

        it("should filter based on the search term", () => {
            cy.fixture("default-equipments.json").then((equipments) => {
                cy.getByTestId("input-search-equipments").type(
                    equipments.equipment1.model
                );

                cy.getByTestId(
                    `equipment-card-${equipments.equipment1.id}`
                ).should("be.visible");
                cy.getByTestId(
                    `equipment-card-${equipments.equipment2.id}`
                ).should("not.exist");
            });
        });
    });
});
