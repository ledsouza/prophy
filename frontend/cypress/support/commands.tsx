/// <reference types="cypress" />

import { UnitOperationDTO } from "@/redux/features/unitApiSlice";
import { randomMobilePhoneNumber } from "@/utils/generator";
import * as cnpj from "validation-br/dist/cnpj";
import { fakerPT_BR as faker } from "@faker-js/faker";
import { OperationStatus, OperationType } from "@/enums";
import { EquipmentOperationDTO } from "@/redux/features/equipmentApiSlice";
import { ClientDTO, ClientOperationDTO } from "@/redux/features/clientApiSlice";

const apiUrl = Cypress.env("apiUrl");

// ***********************************************
declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Custom command to select DOM element by data-testid attribute.
             * @example cy.getByTestId('greeting')
             */
            getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;

            /**
             * Custom command to select nested DOM element by data-testid attributes.
             * @example cy.getByNestedTestId(['greeting', 'hello'])
             */
            getByNestedTestId(
                testIds: string[]
            ): Chainable<JQuery<HTMLElement>>;

            /**
             * Custom command to select an option in a custom combobox.
             * @example cy.typeCombobox('institution-city-input', 'São Paulo')
             */
            selectCombobox(id: string, option: string): Chainable<void>;

            /**
             * Custom command to log in with given credentials.
             * @param cpf - The cpf for login.
             * @param password - The password for login.
             * @example cy.login('admin', 'password123')
             */
            login(cpf: string, password: string): Chainable<void>;

            /**
             * Custom command to persist login sessions by validating the presence of authentication cookies.
             * This command extends the base login command with additional validation.
             *
             * @example
             * cy.loginSession('12345678900', 'password123')
             *
             * @remarks
             * This command will validate that both 'access' and 'refresh' cookies exist after login.
             * If validation fails, the test will fail.
             */
            loginSession(cpf: string, password: string): Chainable<void>;

            /**
             * Custom command to get a random CNPJ from the proposals.json fixture.
             *
             * @example
             * cy.getRandomCnpj().then((cnpj) => {
             *   cy.log(`Random CNPJ: ${cnpj}`);
             * });
             *
             * @returns {Cypress.Chainable<string>} A Cypress chainable that yields a random CNPJ string.
             * @throws {Error} If the fixture file is empty or doesn't contain any CNPJs.
             */
            getRandomCnpj(): Cypress.Chainable<string>;

            /**
             * Custom command to retrieve an FMI (Físico Médico Interno) access token for authentication.
             * This command reads user credentials from the users.json fixture, makes a POST request to the JWT creation endpoint,
             * and returns the access token.
             *
             * @example
             * cy.getFMIAccessToken().then((token) => {
             *   // Use the token for authenticated requests
             *   cy.request({
             *     headers: { Authorization: `Bearer ${token}` }
             *   });
             * });
             *
             * @returns {Cypress.Chainable<string>} A Cypress chainable that yields the access token string
             * @throws Will throw an error if the authentication request fails
             */
            getFMIAccessToken(): Cypress.Chainable<string>;

            /**
             * Custom command to add a unit to the database.
             *
             * @example
             * cy.addUnit()
             */
            addUnit(): Cypress.Chainable<void>;

            /**
             * Custom command to add an equipment to the database.
             *
             * @example
             * cy.addEquipment()
             *
             * @remarks
             * This command will add an equipment to the database and store the response in the 'newEquipment' alias.
             */
            addEquipment(): Cypress.Chainable<void>;
        }
    }
}

Cypress.Commands.add("getByTestId", (testId: string) => {
    return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add("getByNestedTestId", (testIds: string[]) => {
    let selector = "";
    testIds.forEach((testId) => {
        selector = selector + `[data-testid="${testId}"] `;
    });
    return cy.get(selector);
});

Cypress.Commands.add("selectCombobox", (id, option) => {
    cy.getByTestId(id).type(option);
    cy.wait(100);
    cy.get('[role="option"]').click();
});

Cypress.Commands.add("login", (cpf, password) => {
    cy.intercept("POST", "http://localhost:8000/api/jwt/create/").as(
        "loginRequest"
    );

    cy.getByTestId("cpf-input").type(cpf);
    cy.getByTestId("password-input").type(password);
    cy.getByTestId("submit-button").click();

    cy.wait("@loginRequest").then((interception) => {
        expect(interception.response?.statusCode).to.eq(200);

        const { access, refresh } = interception.response?.body;

        cy.setCookie("access", access);
        cy.setCookie("refresh", refresh);
    });

    cy.wait(500);
});

Cypress.Commands.add("loginSession", (cpf: string, password: string) => {
    cy.session(
        [cpf, password],
        () => {
            cy.intercept("POST", "http://localhost:8000/api/jwt/create/").as(
                "loginRequest"
            );

            cy.visit("/auth/login");
            cy.getByTestId("cpf-input").type(cpf);
            cy.getByTestId("password-input").type(password);
            cy.getByTestId("submit-button").click();

            cy.wait("@loginRequest").then((interception) => {
                expect(interception.response?.statusCode).to.eq(200);

                const { access, refresh } = interception.response?.body;

                cy.setCookie("access", access);
                cy.setCookie("refresh", refresh);
            });
        },
        {
            validate: () => {
                cy.getCookie("access").should("exist");
                cy.getCookie("refresh").should("exist");
            },
        }
    );
});

Cypress.Commands.add("getRandomCnpj", () => {
    return cy.fixture("proposals.json").then((fixtureData) => {
        const cnpjs = fixtureData.approved_cnpjs;

        if (cnpjs.length === 0) {
            throw new Error("No CNPJs found in the fixture file.");
        }

        const randomIndex = Math.floor(Math.random() * cnpjs.length);
        return cnpjs[randomIndex];
    });
});

Cypress.Commands.add("getFMIAccessToken", () => {
    cy.fixture("users.json").then((users) => {
        cy.request({
            method: "POST",
            url: `${Cypress.env("apiUrl")}/jwt/create/`,
            body: {
                cpf: users.internal_physicist_user.cpf,
                password: users.internal_physicist_user.password,
            },
        }).then((response) => {
            const { access } = response.body;
            cy.wrap(access).as("accessToken");
        });
    });
});

Cypress.Commands.add("addUnit", () => {
    cy.getFMIAccessToken();

    cy.get("@accessToken").then((accessToken) => {
        cy.fixture("default-clients.json").then((clients) => {
            cy.request({
                method: "POST",
                url: `${Cypress.env("apiUrl")}/units/operations/`,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: {
                    name: "TEST UNIT",
                    cnpj: cnpj.fake({ alphanumeric: false }),
                    phone: randomMobilePhoneNumber(),
                    email: faker.internet.email(),
                    address: "Rua teste",
                    city: "Porto Alegre",
                    state: "RS",
                    client: clients.client1.id,
                    operation_status: OperationStatus.ACCEPTED,
                    operation_type: OperationType.ADD,
                } as UnitOperationDTO,
            }).then((response) => {
                cy.wrap(response.body.id).as("newUnitID");
            });
        });
    });
});

Cypress.Commands.add("addEquipment", () => {
    cy.getFMIAccessToken().then((accessToken) => {
        cy.fixture("default-units.json").then((units) => {
            cy.request({
                method: "POST",
                url: `${Cypress.env("apiUrl")}/equipments/operations/`,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: {
                    name: `TEST EQUIPMENT ${faker.number.int()}`,
                    modality: `TEST EQUIPMENT ${faker.number.int({
                        max: 100,
                    })}`,
                    model: `TEST EQUIPMENT ${faker.number.int({ max: 100 })}`,
                    manufacturer: `TEST EQUIPMENT ${faker.number.int({
                        max: 100,
                    })}`,
                    unit: units.unit1.id,
                    operation_status: OperationStatus.ACCEPTED,
                    operation_type: OperationType.ADD,
                } as Omit<EquipmentOperationDTO, "id">,
            }).then((response) => {
                cy.wrap(response.body).as("newEquipment");
            });
        });
    });
});

// This line is necessary to make the file a module and avoid TypeScript errors
export {};
