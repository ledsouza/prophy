import { ROLE_USERS, type RoleUser } from "../support/roleUsers";

type ProtectedRouteTest = {
    name: string;
    path: string;
    allow: RoleUser[];
};

const ROUTE_MATRIX: ProtectedRouteTest[] = [
    {
        name: "GP unit details",
        path: "/dashboard/unit/1",
        allow: ["admin_user"],
    },
    {
        name: "Commercial search",
        path: "/dashboard",
        allow: [
            "admin_user",
            "client_user",
            "unit_manager_user",
            "comercial_user",
            "external_physicist_user",
            "internal_physicist_user",
        ],
    },
    {
        name: "Materials",
        path: "/dashboard/materials",
        allow: [
            "admin_user",
            "client_user",
            "unit_manager_user",
            "comercial_user",
            "external_physicist_user",
            "internal_physicist_user",
        ],
    },
    {
        name: "GP proposals list",
        path: "/dashboard/proposals",
        allow: ["admin_user"],
    },
];

describe("dashboard - role access control", () => {
    before(() => {
        cy.setupDB();
    });

    for (const routeTest of ROUTE_MATRIX) {
        for (const user of ROLE_USERS) {
            it(`${user} access to ${routeTest.name}`, () => {
                cy.loginAs(user);
                cy.visit(routeTest.path, { failOnStatusCode: false });

                if (routeTest.allow.includes(user)) {
                    cy.location("pathname").should("include", routeTest.path.split("?")[0]);
                } else {
                    cy.location("pathname").should("not.eq", routeTest.path);
                }
            });
        }
    }

    it("renders GP client detail UI for GP and Commercial client detail UI for commercial", () => {
        cy.fixture("default-clients.json").then((clients) => {
            const cnpj: string = clients.client1.cnpj;

            cy.loginAs("admin_user");
            cy.visit(`/dashboard/client/${cnpj}`, { failOnStatusCode: false });

            cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "GP");
            cy.getByCy("gp-update-data-btn").should("exist");
            cy.getByCy("gp-add-unit-btn").should("exist");
            cy.getByCy("commercial-back-btn").should("not.exist");

            cy.loginAs("comercial_user");
            cy.visit(`/dashboard/client/${cnpj}`, { failOnStatusCode: false });

            cy.getByCy("dashboard-root").should("have.attr", "data-cy-role", "C");
            cy.getByCy("commercial-back-btn").should("exist");
            cy.getByCy("gp-update-data-btn").should("not.exist");
            cy.getByCy("gp-add-unit-btn").should("not.exist");
        });
    });
});
