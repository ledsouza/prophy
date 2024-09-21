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
                "bg-light": "rgba(var(--bg-light), <alpha-value>)",
            },
        },
    },
    plugins: [require("@tailwindcss/forms")],
};
export default config;
