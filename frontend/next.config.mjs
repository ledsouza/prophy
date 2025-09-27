/** @type {import('next').NextConfig} */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pkg = require("./package.json");

const nextConfig = {
    reactStrictMode: true,
    env: {
        NEXT_PUBLIC_APP_VERSION: pkg.version,
    },
    trailingSlash: true,
    images: {
        dangerouslyAllowSVG: true,
        contentDispositionType: "attachment",
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
        remotePatterns: [
            {
                protocol: "https",
                hostname: "tailwindui.com",
                port: "",
                pathname: "/**",
            },
            {
                protocol: "http",
                hostname: "localhost",
                port: "8000",
                pathname: "/**",
            },
        ],
    },
};

export default nextConfig;
