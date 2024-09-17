/** @type {import('next').NextConfig} */
const nextConfig = {
    trailingSlash: true,
    images: {
        dangerouslyAllowSVG: true,
        contentDispositionType: "attachment",
        contentSecurityPolicy:
            "default-src 'self'; script-src 'none'; sandbox;",
        remotePatterns: [
            {
                protocol: "https",
                hostname: "tailwindui.com",
                port: "",
                pathname: "/**",
            },
        ],
    },
};

export default nextConfig;
