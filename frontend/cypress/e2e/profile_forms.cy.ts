import {
    DESKTOP_VIEWPORT,
    MOBILE_VIEWPORT,
    describeForViewports,
} from "../support/e2eTestUtils";

const API_URL = Cypress.env("apiUrl") as string;
const PROFILE_URL = "/dashboard/profile";
const PROFILE_ENDPOINT = `${API_URL}/users/me/`;
const CHANGE_PASSWORD_ENDPOINT = `${API_URL}/users/set_password/`;
const ADMIN_CPF = "03446254005";
const OLD_PASSWORD = "passwordtest";
const NEW_PASSWORD = "ProfileTest@123";

describe("profile forms", () => {
    describeForViewports([DESKTOP_VIEWPORT, MOBILE_VIEWPORT], (viewport) => {
        beforeEach(() => {
            cy.setupDB();
            cy.loginAs("admin_user");
            cy.intercept("GET", PROFILE_ENDPOINT).as("getOwnProfile");
            cy.intercept("PATCH", PROFILE_ENDPOINT).as("updateOwnProfile");
            cy.intercept("POST", CHANGE_PASSWORD_ENDPOINT).as("changeOwnPassword");
        });

        it(`renders the profile page and keeps both forms accessible on ${viewport.name}`, () => {
            cy.visit(PROFILE_URL);

            cy.wait("@getOwnProfile");
            cy.location("pathname").should("match", /^\/dashboard\/profile\/?$/);
            cy.getByCy("profile-page").should("be.visible");
            cy.getByCy("profile-name-input").should("be.visible");
            cy.getByCy("profile-save-btn").scrollIntoView().should("be.visible");
            cy.getByCy("profile-current-password-input").scrollIntoView().should("be.visible");
            cy.getByCy("profile-change-password-btn").scrollIntoView().should("be.visible");

            if (viewport.isMobile) {
                cy.window().then((win) => {
                    const root = win.document.documentElement;
                    expect(root.scrollWidth).to.be.at.most(root.clientWidth);
                });
            }
        });

        it(`shows prefilled data and keeps CPF and role read-only on ${viewport.name}`, () => {
            cy.visit(PROFILE_URL);

            cy.wait("@getOwnProfile");
            cy.getByCy("profile-cpf-input").should("be.disabled").and("have.value", ADMIN_CPF);
            cy.getByCy("profile-role-input")
                .should("be.disabled")
                .and("have.value", "Gerente Prophy");
            cy.getByCy("profile-name-input").should("have.value", "Alexandre Ferret");
            cy.getByCy("profile-email-input").should(
                "have.value",
                "alexandre.ferret@email.com",
            );
            cy.getByCy("profile-phone-input")
                .invoke("val")
                .should("match", /^\d{10,13}$/);
        });

        it(`updates allowed profile fields successfully on ${viewport.name}`, () => {
            cy.visit(PROFILE_URL);

            cy.wait("@getOwnProfile");
            cy.getByCy("profile-name-input").clear().type("Administrador Cypress");
            cy.getByCy("profile-email-input").clear().type("admin.cypress@example.com");
            cy.getByCy("profile-phone-input").clear().type("11988887777");
            cy.getByCy("profile-save-btn").scrollIntoView().click();

            cy.wait("@updateOwnProfile")
                .its("request.body")
                .should("deep.equal", {
                    name: "Administrador Cypress",
                    email: "admin.cypress@example.com",
                    phone: "11988887777",
                });

            cy.contains("Perfil atualizado com sucesso.", {
                timeout: 10_000,
            }).should("be.visible");

            cy.visit(PROFILE_URL);
            cy.wait("@getOwnProfile");
            cy.getByCy("profile-name-input").should("have.value", "Administrador Cypress");
            cy.getByCy("profile-email-input").should("have.value", "admin.cypress@example.com");
            cy.getByCy("profile-phone-input").should("have.value", "11988887777");
        });

        it(`blocks password submission when confirmation does not match on ${viewport.name}`, () => {
            cy.visit(PROFILE_URL);

            cy.wait("@getOwnProfile");
            cy.getByCy("profile-current-password-input").type(OLD_PASSWORD);
            cy.getByCy("profile-new-password-input").type(NEW_PASSWORD);
            cy.getByCy("profile-confirm-password-input").type("DifferentPass@123");
            cy.getByCy("profile-change-password-btn").scrollIntoView().click();

            cy.contains("As senhas não coincidem.").should("be.visible");
            cy.get("@changeOwnPassword.all").should("have.length", 0);
        });

        it(`changes the password successfully on ${viewport.name}`, () => {
            cy.visit(PROFILE_URL);

            cy.wait("@getOwnProfile");
            cy.getByCy("profile-current-password-input").type(OLD_PASSWORD);
            cy.getByCy("profile-new-password-input").type(NEW_PASSWORD);
            cy.getByCy("profile-confirm-password-input").type(NEW_PASSWORD);
            cy.getByCy("profile-change-password-btn").scrollIntoView().click();

            cy.wait("@changeOwnPassword")
                .its("request.body")
                .should("deep.equal", {
                    current_password: OLD_PASSWORD,
                    new_password: NEW_PASSWORD,
                    re_new_password: NEW_PASSWORD,
                });

            cy.contains("Senha atualizada com sucesso.", {
                timeout: 10_000,
            }).should("be.visible");

            cy.clearCookies();
            cy.request({
                method: "POST",
                url: `${API_URL}/jwt/create/`,
                body: {
                    cpf: ADMIN_CPF,
                    password: OLD_PASSWORD,
                },
                failOnStatusCode: false,
            }).its("status").should("eq", 401);

            cy.request({
                method: "POST",
                url: `${API_URL}/jwt/create/`,
                body: {
                    cpf: ADMIN_CPF,
                    password: NEW_PASSWORD,
                },
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property("access");
                expect(response.body).to.have.property("refresh");
            });
        });
    });
});