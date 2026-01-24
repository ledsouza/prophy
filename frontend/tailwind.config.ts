import type { Config } from "tailwindcss";

const config: Config = {
    content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./cypress/**/*.{js,ts,jsx,tsx}"],
    theme: {},
    plugins: [require("@tailwindcss/forms")],
};
export default config;
