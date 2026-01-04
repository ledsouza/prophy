import "./commands";

Cypress.on("uncaught:exception", (err) => {
    if (err.message.includes("NEXT_REDIRECT")) {
        return false;
    }

    if (
        err.message.includes("Minified React error #418") ||
        err.message.includes("Minified React error #423")
    ) {
        return false;
    }
});
