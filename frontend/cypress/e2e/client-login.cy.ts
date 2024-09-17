describe("Client login", () => {
    const username = "admin";
    const password = "password123";

    beforeEach(() => {
        cy.visit("/auth/login");
    });

    it("should display the login form", () => {
        cy.getByTestId("title-form").should("contain", "Acesse a sua conta");
        cy.getByTestId("username-input").should("exist");
        cy.getByTestId("password-input").should("exist");
        cy.getByTestId("submit-button").should("contain", "Acessar");
    });

    it("should successfully log in with valid credentials", () => {
        cy.login(username, password);

        cy.getCookie("access").should("exist");
        cy.getCookie("refresh").should("exist");

        cy.contains("Você está autenticado!").should("be.visible");
    });

    it("should redirect to the client dashboard after successful login", () => {
        cy.login(username, password);

        cy.url().should("include", "/dashboard/");
        cy.getByTestId("dashboard-title").should("contain", "Dashboard");
    });

    it("shows an error message if login fails", () => {
        cy.getByTestId("username-input").type("wronguser");
        cy.getByTestId("password-input").type("wrongpassword");
        cy.getByTestId("submit-button").click();

        cy.contains(
            "Houve uma falha ao acessar sua conta. Verifique se o usuário e senha estão corretos"
        ).should("be.visible");
    });

    it("shows an error message if username field is empty", () => {
        cy.getByTestId("password-input").type(password);
        cy.getByTestId("submit-button").click();

        cy.getByTestId("validation-error").should(
            "contain",
            "O usuário é necessário"
        );
    });

    it("shows an error message if password field is empty", () => {
        cy.getByTestId("username-input").type(username);
        cy.getByTestId("submit-button").click();

        cy.getByTestId("validation-error").should(
            "contain",
            "A senha deve conter no mínimo 8 caracteres"
        );
    });

    it("should persist login state on page refresh", () => {
        cy.login(username, password);

        cy.reload();

        cy.getCookie("access").should("exist");
        cy.getCookie("refresh").should("exist");

        cy.url().should("include", "/dashboard/");
        cy.getByTestId("dashboard-title").should("contain", "Dashboard");
    });

    it("should allow user to log out", () => {
        cy.login(username, password);

        cy.getByTestId("logout-btn").click();

        cy.url().should("include", "/auth/login/");
    });
});
