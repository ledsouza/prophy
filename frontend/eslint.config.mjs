import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";
import reactHooksPlugin from "eslint-plugin-react-hooks";

/**
 * ESLint 9 flat config for this Next.js project (Storybook removed).
 *
 * Replaces the old .eslintrc.json that extended:
 * - next/core-web-vitals
 */
export default [
    {
        ignores: ["node_modules", ".next", "out", "dist", "coverage"],
    },
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            "@next/next": nextPlugin,
            "react-hooks": reactHooksPlugin,
        },
        rules: {
            // Next.js core web vitals rules
            ...nextPlugin.configs["core-web-vitals"].rules,
            // React Hooks rules
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
        },
    },
];
