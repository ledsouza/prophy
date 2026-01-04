import "./commands";

import { mount } from "cypress/react18";
import Provider from "@/redux/Provider";

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
declare global {
    namespace Cypress {
        interface Chainable {
            mount: typeof mount;
        }
    }
}

Cypress.Commands.add("mount", (component, options) => {
    return mount(<Provider>{component}</Provider>, options);
});

// Example use:
// cy.mount(<MyComponent />)
