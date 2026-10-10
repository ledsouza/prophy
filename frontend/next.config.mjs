/** @type {import('next').NextConfig} */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkg = require("./package.json");

const isProd = process.env.NODE_ENV === "production";

const backendHostname =
    process.env.NEXT_PUBLIC_HOST &&
    !process.env.NEXT_PUBLIC_HOST.includes("localhost")
        ? new URL(process.env.NEXT_PUBLIC_HOST).hostname
        : "api.prophy.com";

// Public hostname without scheme, baked in at build time. Unset outside
// production, which leaves the app reachable under any hostname.
const canonicalHost = process.env.CANONICAL_HOST;

const devRemotePatterns = isProd
    ? []
    : [
          {
              protocol: "http",
              hostname: "localhost",
              port: "8000",
              pathname: "/**",
          },
          {
              protocol: "http",
              hostname: "backend-e2e",
              port: "8080",
              pathname: "/**",
          },
          {
              protocol: "http",
              hostname: "proxy",
              port: "8080",
              pathname: "/**",
          },
      ];

const nextConfig = {
    reactStrictMode: true,
    env: {
        NEXT_PUBLIC_APP_VERSION: pkg.version,
    },
    output: "standalone",
    serverExternalPackages: ["pino", "pino-pretty"],
    outputFileTracingRoot: path.join(__dirname, ".."),
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
                protocol: "https",
                hostname: backendHostname,
                port: "",
                pathname: "/**",
            },
            ...devRemotePatterns,
        ],
    },
    async redirects() {
        if (!canonicalHost) {
            return [];
        }

        const canonicalHostPattern = canonicalHost.replaceAll(".", "\\.");

        // The API only accepts the canonical origin, so the app cannot log
        // in under its *.run.app address. The Cloudflare Worker in
        // infra/cloudflare/ rewrites Host to that address and carries the
        // public hostname in X-Forwarded-Host, hence the two "missing"
        // conditions.
        // The image optimizer fetches files in public/ through this same
        // router with a request that has no headers; requiring a Host keeps
        // the rule off those, which would otherwise answer 400.
        // Temporary on purpose: browsers cache a permanent redirect
        // indefinitely, which would outlive a change of domain.
        return [
            {
                source: "/:path*",
                has: [{ type: "host", value: ".+" }],
                missing: [
                    {
                        type: "header",
                        key: "x-forwarded-host",
                        value: canonicalHostPattern,
                    },
                    { type: "host", value: canonicalHostPattern },
                ],
                destination: `https://${canonicalHost}/:path*`,
                permanent: false,
            },
        ];
    },
};

export default nextConfig;
