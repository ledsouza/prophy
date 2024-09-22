import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "rgba(var(--primary), <alpha-value>)",
                secondary: "rgba(var(--secondary), <alpha-value>)",
                tertiary: "rgba(var(--tertiary), <alpha-value>)",
                quaternary: "rgba(var(--quaternary), <alpha-value>)",
                "text-primary": "rgba(var(--text-primary), <alpha-value>)",
                "text-secondary": "rgba(var(--text-secondary), <alpha-value>)",
                "text-tertiary": "rgba(var(--text-tertiary), <alpha-value>)",
                "text-quaternary":
                    "rgba(var(--text-quaternary), <alpha-value>)",
                "text-disabled": "rgba(var(--text-disabled), <alpha-value>)",
                "text-placeholder":
                    "rgba(var(--text-placeholder), <alpha-value>)",
            },
        },
    },
    plugins: [require("@tailwindcss/forms")],
};
export default config;
