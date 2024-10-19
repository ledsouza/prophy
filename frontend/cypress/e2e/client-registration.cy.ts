import { fakerPT_BR as faker } from "@faker-js/faker";
import { errorMessages } from "cypress/support/e2e";
import { generate as fakeCPF } from "gerador-validador-cpf";

describe("Client Registration", () => {
    const fakerPhone = () => {
        return faker.phone
            .number({ style: "national" })
            .replace("(", "")
            .replace(")", "")
            .replace("-", "")
            .replace(/\s/g, "");
    };

    beforeEach(() => {
        cy.visit("/auth/register");
    });

    context("CNPJ Form Rendering", () => {
        it("should display the cnpj form", () => {
            cy.getByTestId("title-form").should(
                "contain",
                "Insira o CNPJ da sua instituição"
            );
            cy.getByTestId("subtitle-form").should(
                "contain",
                "Para prosseguir com o cadastro da sua instituição, é necessário que o seu CNPJ esteja validado."
            );

            cy.getByTestId("input-cnpj").should("exist");
            cy.getByTestId("button-submit").should("exist");
        });
    });

    context("CNPJ Form Failure Scenario", () => {
        it("shows an error message if unauthorized cnpj", () => {
            cy.fixture("propostas.json").then((propostas) => {
                cy.getByTestId("input-cnpj").type(propostas.rejected_cnpj);
            });
            cy.getByTestId("button-submit").click();

            cy.get("[role='alert']").should(
                "contain",
                "O CNPJ não é válido. Verifique se você digitou corretamente ou entre em contato conosco."
            );
        });

        it("shows an error message if empty cnpj", () => {
            cy.getByTestId("button-submit").click();

            cy.getByTestId("validation-error").should(
                "contain",
                "O CNPJ deve conter 14 caracteres"
            );
        });

        it("shows an error message if invalid cnpj", () => {
            cy.getByTestId("input-cnpj").type("12345678000190");
            cy.getByTestId("button-submit").click();

            cy.getByTestId("validation-error").should(
                "contain",
                "Digite um CNPJ válido"
            );
        });

        it("shows an error message if cnpj doesn't exist", () => {
            cy.getByTestId("input-cnpj").type("04688907000146");
            cy.getByTestId("button-submit").click();

            cy.get("[role='alert']").should(
                "contain",
                "Nenhum cliente foi encontrado com esse CNPJ"
            );
        });

        it("shows an error message if cnpj is already registered", () => {
            cy.fixture("registered-client.json.json").then((client) => {
                cy.getByTestId("input-cnpj").type(client.registered_cnpj);
            });
            cy.getByTestId("button-submit").click();

            cy.getByTestId("validation-error").should(
                "contain",
                "Este CNPJ já está cadastrado."
            );
        });
    });

    context("CNPJ Form Success Scenario", () => {
        it("should successfully open a registration form with authorized cnpj", () => {
            cy.getRandomCnpj().then((validCnpj) => {
                cy.getByTestId("input-cnpj").type(validCnpj);
            });
            cy.getByTestId("button-submit").click();

            cy.contains("CNPJ Válido! Prossiga com o cadastro.").should(
                "exist"
            );

            cy.getByTestId("cpf-input").should("exist");
            cy.getByTestId("password-input").should("exist");
            cy.getByTestId("repassword-input").should("exist");
            cy.getByTestId("institution-name-input").should("exist");
            cy.getByTestId("institution-email-input").should("exist");
            cy.getByTestId("institution-phone-input").should("exist");
            cy.getByTestId("institution-state-input").should("exist");
            cy.getByTestId("institution-city-input").should("exist");
            cy.getByTestId("institution-address-input").should("exist");
            cy.getByTestId("name-input").should("exist");
            cy.getByTestId("email-input").should("exist");

            cy.getByTestId("submit-btn").should("exist");
            cy.getByTestId("cancel-btn").should("exist");
        });
    });

    context("Client Form Failure Scenario", () => {
        it("should show error messages for empty required fields", () => {
            cy.getRandomCnpj().then((validCnpj) => {
                cy.getByTestId("input-cnpj").type(validCnpj);
            });
            cy.getByTestId("button-submit").click();
            cy.getByTestId("submit-btn").click();

            Object.values(errorMessages).forEach((errorMessage) => {
                cy.getByTestId("validation-error").should(
                    "contain",
                    errorMessage
                );
            });
        });

        it("should show an error message for mismatched passwords", () => {
            cy.getRandomCnpj().then((validCnpj) => {
                cy.getByTestId("input-cnpj").type(validCnpj);
            });
            cy.getByTestId("button-submit").click();

            cy.getByTestId("cpf-input").type(fakeCPF());
            cy.getByTestId("password-input").type("StrongPassword123!");
            cy.getByTestId("repassword-input").type("DifferentPassword123!");
            cy.getByTestId("institution-name-input").type(faker.company.name());
            cy.getByTestId("institution-email-input").type(
                faker.internet.email()
            );
            cy.getByTestId("institution-phone-input").type(fakerPhone());
            cy.selectCombobox("institution-state-input", "São Paulo");
            cy.selectCombobox("institution-city-input", "São Paulo");
            cy.getByTestId("institution-address-input").type(
                faker.location.streetAddress()
            );
            cy.getByTestId("name-input").type(faker.person.fullName());
            cy.getByTestId("email-input").type(faker.internet.email());

            cy.getByTestId("submit-btn").click();

            cy.getByTestId("validation-error").should(
                "contain",
                "As senhas não coincidem"
            );
        });

        it("should show an error message for only numeric passwords", () => {
            cy.getRandomCnpj().then((validCnpj) => {
                cy.getByTestId("input-cnpj").type(validCnpj);
            });
            cy.getByTestId("button-submit").click();

            cy.getByTestId("cpf-input").type(fakeCPF());
            cy.getByTestId("password-input").type("10678910");
            cy.getByTestId("repassword-input").type("10678910");
            cy.getByTestId("institution-name-input").type(faker.company.name());
            cy.getByTestId("institution-email-input").type(
                faker.internet.email()
            );
            cy.getByTestId("institution-phone-input").type(fakerPhone());
            cy.selectCombobox("institution-state-input", "São Paulo");
            cy.selectCombobox("institution-city-input", "São Paulo");
            cy.getByTestId("institution-address-input").type(
                faker.location.streetAddress()
            );
            cy.getByTestId("name-input").type(faker.person.fullName());
            cy.getByTestId("email-input").type(faker.internet.email());

            cy.getByTestId("submit-btn").click();

            cy.getByTestId("validation-error").should(
                "contain",
                "Evite senhas que contenham apenas números."
            );
        });

        it("should show an error message for weak passwords", () => {
            cy.getRandomCnpj().then((validCnpj) => {
                cy.getByTestId("input-cnpj").type(validCnpj);
            });
            cy.getByTestId("button-submit").click();

            cy.getByTestId("password-input").type("password");
            cy.getByTestId("submit-btn").click();

            cy.getByTestId("validation-error").should(
                "contain",
                "Sua senha é muito fraca e coloca sua conta em risco. Por favor, crie uma senha mais forte."
            );
        });

        it("should show an error message for invalid email formats", () => {
            cy.getRandomCnpj().then((validCnpj) => {
                cy.getByTestId("input-cnpj").type(validCnpj);
            });
            cy.getByTestId("button-submit").click();

            cy.getByTestId("email-input").type("invalid-email");
            cy.getByTestId("institution-email-input").type(
                "another-invalid-email"
            );
            cy.getByTestId("submit-btn").click();

            cy.getByTestId("validation-error").should(
                "contain",
                "E-mail do contato inválido"
            );
            cy.getByTestId("validation-error").should(
                "contain",
                "E-mail da instituição inválido"
            );
        });

        it("should show an error message for invalid phone number format", () => {
            cy.getRandomCnpj().then((validCnpj) => {
                cy.getByTestId("input-cnpj").type(validCnpj);
            });
            cy.getByTestId("button-submit").click();

            cy.getByTestId("institution-phone-input").type("(51)5555555");
            cy.getByTestId("submit-btn").click();

            cy.getByTestId("validation-error").should(
                "contain",
                "Telefone deve conter apenas números com padrão nacional (DD9XXXXXXXX)."
            );
        });

        it("should show an error message for already registered cpf", () => {
            cy.intercept("POST", "http://localhost:8000/api/users/").as(
                "registerUser"
            );

            const password = "StrongPassword123!";
            const fakeCompany = faker.company.name();
            const fakeEmailCompany = faker.internet.email();
            const fakePhone = fakerPhone();
            const fakeState = "São Paulo";
            const fakeCity = "São Paulo";
            const fakeStreet = faker.location.streetAddress();
            const fakeContactName = faker.person.fullName();
            const fakeContactEmail = faker.internet.email();

            let validCnpj: string;
            cy.getRandomCnpj().then((cnpj) => {
                validCnpj = cnpj;
                cy.getByTestId("input-cnpj").type(validCnpj);
            });
            cy.getByTestId("button-submit").click();

            cy.fixture("users.json").then((users) => {
                cy.getByTestId("cpf-input").type(users.admin_user.cpf);
            });
            cy.getByTestId("password-input").type(password);
            cy.getByTestId("repassword-input").type(password);
            cy.getByTestId("institution-name-input").type(fakeCompany);
            cy.getByTestId("institution-email-input").type(fakeEmailCompany);
            cy.getByTestId("institution-phone-input").type(fakePhone);
            cy.selectCombobox("institution-state-input", fakeState);
            cy.selectCombobox("institution-city-input", fakeCity);
            cy.getByTestId("institution-address-input").type(fakeStreet);
            cy.getByTestId("name-input").type(fakeContactName);
            cy.getByTestId("email-input").type(fakeContactEmail);

            cy.getByTestId("submit-btn").click();

            cy.wait("@registerUser").then((interception) => {
                expect(interception.response?.statusCode).to.eq(400);
            });

            cy.get("[role='alert']").should(
                "contain",
                "Um usuário com este CPF já existe."
            );
        });
    });

    context("Client Form Success Scenario", () => {
        it("should successfully submit the form with valid data and be redirect to client dashboard", () => {
            cy.intercept("POST", "http://localhost:8000/api/users/").as(
                "registerUser"
            );
            cy.intercept("POST", "http://localhost:8000/api/jwt/create/").as(
                "loginUser"
            );
            cy.intercept("POST", "http://localhost:8000/api/clientes/").as(
                "createClient"
            );

            const cpf = fakeCPF();
            const password = "StrongPassword123!";
            const fakeCompany = faker.company.name();
            const fakeEmailCompany = faker.internet.email();
            const fakePhone = fakerPhone();
            const fakeState = "São Paulo";
            const fakeUF = "SP";
            const fakeCity = "São Paulo";
            const fakeStreet = faker.location.streetAddress();
            const fakeContactName = faker.person.fullName();
            const fakeContactEmail = faker.internet.email();

            let validCnpj: string;
            cy.getRandomCnpj().then((cnpj) => {
                validCnpj = cnpj;
                cy.getByTestId("input-cnpj").type(validCnpj);
            });
            cy.getByTestId("button-submit").click();

            cy.getByTestId("cpf-input").type(cpf);
            cy.getByTestId("password-input").type(password);
            cy.getByTestId("repassword-input").type(password);
            cy.getByTestId("institution-name-input").type(fakeCompany);
            cy.getByTestId("institution-email-input").type(fakeEmailCompany);
            cy.getByTestId("institution-phone-input").type(fakePhone);
            cy.selectCombobox("institution-state-input", fakeState);
            cy.selectCombobox("institution-city-input", fakeCity);
            cy.getByTestId("institution-address-input").type(fakeStreet);
            cy.getByTestId("name-input").type(fakeContactName);
            cy.getByTestId("email-input").type(fakeContactEmail);

            cy.getByTestId("submit-btn").click();

            cy.wait("@registerUser").then((interception) => {
                expect(interception.response?.statusCode).to.eq(201);

                expect(interception.request.body).to.have.property("cpf", cpf);
                expect(interception.request.body).to.have.property(
                    "password",
                    password
                );
                expect(interception.request.body).to.have.property(
                    "re_password",
                    password
                );
            });

            cy.wait("@loginUser").then((interception) => {
                expect(interception.response?.statusCode).to.eq(200);

                expect(interception.request.body).to.have.property("cpf", cpf);
                expect(interception.request.body).to.have.property(
                    "password",
                    password
                );

                const { access, refresh } = interception.response?.body;

                cy.setCookie("access", access);
                cy.setCookie("refresh", refresh);
            });

            cy.wait("@createClient").then((interception) => {
                expect(interception.response?.statusCode).to.eq(201);

                expect(interception.request.body).to.deep.equal({
                    cnpj: validCnpj,
                    nome_instituicao: fakeCompany,
                    nome_contato: fakeContactName,
                    email_contato: fakeContactEmail,
                    email_instituicao: fakeEmailCompany,
                    telefone_instituicao: fakePhone,
                    endereco_instituicao: fakeStreet,
                    estado_instituicao: fakeUF,
                    cidade_instituicao: fakeCity,
                });
            });

            cy.contains("O seu cadastro foi realizado com sucesso!").should(
                "be.visible"
            );
            cy.url().should("include", "/dashboard/");
            cy.getByTestId("client-header").should("be.visible");
        });

        it("should close the form when cancel button is clicked", () => {
            cy.getRandomCnpj().then((validCnpj) => {
                cy.getByTestId("input-cnpj").type(validCnpj);
            });
            cy.getByTestId("button-submit").click();

            cy.getByTestId("cancel-btn").click();

            cy.getByTestId("modal").should("not.exist");
        });
    });
});
