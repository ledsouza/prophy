const frontendOriginUrl = Cypress.expose("frontendOriginUrl") as
    | string
    | undefined;
const canonicalHost = new URL(Cypress.config("baseUrl") as string).hostname;

const LOGIN_PATH = "/auth/login/";
const OPTIMIZED_PUBLIC_IMAGE_PATH =
    "/_next/image?url=%2Fimages%2Fprophy-big-logo.avif&w=384&q=75";

describe("canonical host redirect", () => {
    before(function () {
        // The redirect is baked in at build time and only the staging stack
        // builds with it, so a local run against `next dev` has nothing to
        // assert.
        if (frontendOriginUrl === undefined) {
            this.skip();
        }
    });

    beforeEach(() => {
        cy.setupDB();
    });

    it("redirects a request addressed to another hostname", () => {
        cy.request({
            url: `${frontendOriginUrl}${LOGIN_PATH}`,
            followRedirect: false,
        }).then((response) => {
            const location = new URL(response.headers.location as string);

            expect(response.status).to.eq(307);
            expect(location.protocol).to.eq("https:");
            expect(location.host).to.eq(canonicalHost);
            expect(location.pathname).to.match(/^\/auth\/login\/?$/);
        });
    });

    it("serves a request a proxy forwarded for the canonical hostname", () => {
        cy.request({
            url: `${frontendOriginUrl}${LOGIN_PATH}`,
            headers: { "X-Forwarded-Host": canonicalHost },
            followRedirect: false,
        })
            .its("status")
            .should("eq", 200);
    });

    it("serves a request addressed to the canonical hostname", () => {
        cy.request({ url: LOGIN_PATH, followRedirect: false })
            .its("status")
            .should("eq", 200);
    });

    it("keeps serving public images through the image optimizer", () => {
        cy.request(OPTIMIZED_PUBLIC_IMAGE_PATH).its("status").should("eq", 200);
    });
});
