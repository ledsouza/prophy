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
                danger: "rgba(var(--danger), <alpha-value>)",
                success: "rgba(var(--success), <alpha-value>)",
            },
            backgroundColor: {
                light: "#F6F8FC",
            },
            textColor: {
                gray: {
                    primary: "rgba(var(--text-primary), <alpha-value>)",
                    secondary: "rgba(var(--text-secondary), <alpha-value>)",
                    tertiary: "rgba(var(--text-tertiary), <alpha-value>)",
                },
                disabled: "rgba(var(--text-disabled), <alpha-value>)",
                placeholder: "rgba(var(--text-placeholder), <alpha-value>)",
            },
            keyframes: {
                warning: {
                    "0%, 100%": {
                        "box-shadow": "0 0 0 2px rgb(234 179 8 / 0.6)",
                    },
                    "50%": { "box-shadow": "0 0 0 2px rgb(234 179 8 / 0.1)" },
                },
                danger: {
                    "0%, 100%": {
                        "box-shadow": "0 0 0 2px rgb(220 38 38 / 0.6)",
                    },
                    "50%": {
                        "box-shadow": "0 0 0 2px rgb(220 38 38 / 0.1)",
                    },
                },
            },
            animation: {
                warning: "warning 2s ease-in-out infinite",
                danger: "danger 2s ease-in-out infinite",
            },
        },
    },
    plugins: [require("@tailwindcss/forms")],
};
export default config;
