describe("Client Login", () => {
    beforeEach(() => {
        cy.visit("/auth/login");
    });

    context("Rendering", () => {
        it("should display the login form", () => {
            cy.getByTestId("title-form").should(
                "contain",
                "Acesse a sua conta"
            );
            cy.getByTestId("cpf-input").should("exist");
            cy.getByTestId("password-input").should("exist");
            cy.getByTestId("submit-button").should("contain", "Acessar");
        });
    });

    context("Success Scenario", () => {
        it("should successfully log in with valid credentials", () => {
            cy.fixture("users.json").then((users) => {
                cy.login(users.admin_user.cpf, users.admin_user.password);
            });

            cy.getCookie("access").should("exist");
            cy.getCookie("refresh").should("exist");

            cy.contains("Você está autenticado!").should("be.visible");
        });

        it("should redirect to the client dashboard after successful login", () => {
            cy.fixture("users.json").then((users) => {
                cy.login(users.admin_user.cpf, users.admin_user.password);
            });

            cy.url().should("include", "/dashboard/");
            cy.getByTestId("dashboard-title").should("contain", "Dashboard");
        });

        it("should persist login state on page refresh", () => {
            cy.fixture("users.json").then((users) => {
                cy.login(users.admin_user.cpf, users.admin_user.password);
            });

            cy.reload();

            cy.getCookie("access").should("exist");
            cy.getCookie("refresh").should("exist");

            cy.wait(500);
            cy.url().should("include", "/dashboard/");
            cy.getByTestId("dashboard-title").should("contain", "Dashboard");
        });

        it("should allow user to log out", () => {
            cy.fixture("users.json").then((users) => {
                cy.login(users.admin_user.cpf, users.admin_user.password);
            });

            cy.getByTestId("logout-btn").click();

            cy.url().should("include", "/auth/login/");
        });
    });

    context("Failure Scenario", () => {
        it("shows an error message if login fails", () => {
            cy.getByTestId("cpf-input").type("wronguser");
            cy.getByTestId("password-input").type("wrongpassword");
            cy.getByTestId("submit-button").click();

            cy.contains(
                "Houve uma falha ao acessar sua conta. Verifique se o CPF e senha estão corretos"
            ).should("be.visible");
        });

        it("shows an error message if cpf field is empty", () => {
            cy.fixture("users.json").then((users) => {
                cy.getByTestId("password-input").type(
                    users.admin_user.password
                );
            });
            cy.getByTestId("submit-button").click();

            cy.getByTestId("validation-error").should(
                "contain",
                "O CPF é necessário"
            );
        });

        it("shows an error message if password field is empty", () => {
            cy.fixture("users.json").then((users) => {
                cy.getByTestId("cpf-input").type(users.admin_user.cpf);
            });
            cy.getByTestId("submit-button").click();

            cy.getByTestId("validation-error").should(
                "contain",
                "A senha deve conter no mínimo 8 caracteres"
            );
        });
    });
});
