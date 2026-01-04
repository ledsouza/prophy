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
    {
        name: "GP client details",
        path: "/dashboard/client/00000000000000",
        allow: ["admin_user"],
    },
    {
        name: "Commercial client details",
        path: "/dashboard/client/00000000000000",
        allow: ["comercial_user"],
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
});
