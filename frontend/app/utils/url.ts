const normalizePath = (value: string) => {
    if (!value.startsWith("/")) {
        return `/${value}`;
    }

    return value;
};

const joinUrl = (base: string, path: string) => {
    const normalizedBase = base.replace(/\/$/, "");
    const normalizedPath = normalizePath(path);

    return `${normalizedBase}${normalizedPath}`;
};

export const getIdFromUrl = (pathname: string) => {
    const parts = pathname.split("/").filter(Boolean);
    const lastSegment = parts[parts.length - 1] ?? "";
    const id = Number(lastSegment);

    return Number.isNaN(id) ? 0 : id;
};

export const resolveApiBaseUrl = () => {
    if (typeof window !== "undefined") {
        return "/api/";
    }

    const host = process.env.NEXT_PUBLIC_HOST;

    if (host) {
        return joinUrl(host, "/api/");
    }

    return "/api/";
};

export const resolveApiPath = (path: string) => {
    if (typeof window !== "undefined") {
        return normalizePath(path);
    }

    const host = process.env.NEXT_PUBLIC_HOST;
    const normalizedPath = normalizePath(path);

    if (host) {
        return joinUrl(host, normalizedPath);
    }

    return normalizedPath;
};

export const resolveMediaPath = (path: string) => {
    if (!path) {
        return path;
    }

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    return resolveApiPath(path);
};