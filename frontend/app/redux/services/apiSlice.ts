import { child } from "@/utils/logger";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Mutex } from "async-mutex";
import { logout, setAuth } from "../features/authSlice";

const baseUrl = `${process.env.NEXT_PUBLIC_HOST}/api/`;

const log = child({ feature: "apiSlice" });

const mutex = new Mutex();
const baseQuery = fetchBaseQuery({
    baseUrl: baseUrl,
    credentials: "include",
});

// Middleware for all apiSlice requests
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions,
) => {
    await mutex.waitForUnlock();
    let result = await baseQuery(args, api, extraOptions);
    if (result.error && result.error.status === 401) {
        try {
            const endpoint = typeof args === "string" ? args : (args as FetchArgs).url;
            log.warn({ endpoint }, "API request unauthorized (401)");
        } catch {
            log.warn("API request unauthorized (401)");
        }
        // If the middleware isn't running, refresh the token and retry request
        if (!mutex.isLocked()) {
            const release = await mutex.acquire();
            try {
                const refreshResult = await baseQuery(
                    {
                        url: "jwt/refresh/",
                        method: "POST",
                    },
                    api,
                    extraOptions,
                );
                if (refreshResult.data) {
                    log.info("Token refreshed; retrying original request");
                    api.dispatch(setAuth());
                    result = await baseQuery(args, api, extraOptions);
                } else {
                    log.warn("Token refresh failed; logging out");
                    api.dispatch(logout());
                }
            } finally {
                release();
            }
            // If the middleware is running, wait until finish and retry request
        } else {
            log.debug("Waiting for ongoing token refresh");
            await mutex.waitForUnlock();
            result = await baseQuery(args, api, extraOptions);
        }
    }
    if (result.error && result.error.status !== 401) {
        const status = result.error.status;
        const endpoint = typeof args === "string" ? args : args.url;
        const method = typeof args === "string" ? "GET" : (args.method ?? "GET");

        const errorMessage =
            typeof result.error === "object" && result.error && "error" in result.error
                ? String((result.error as { error?: unknown }).error ?? "")
                : "";

        const fields = {
            status,
            endpoint,
            method,
            error: errorMessage.length > 0 ? errorMessage : undefined,
        };

        if (typeof status === "number" && status >= 500) {
            log.error(fields, "API request failed");
        } else {
            log.warn(fields, "API request failed");
        }
    }
    return result;
};

export const clearApiCache = () => apiSlice.util.resetApiState();

export const getClientByCnpj = async (cnpj: string) => {
    const response = await fetch(`${baseUrl}clients/?cnpj=${cnpj}`);
    const data = await response.json();
    return data.results;
};

export const apiSlice = createApi({
    reducerPath: "api",
    baseQuery: baseQueryWithReauth,
    tagTypes: [
        "User",
        "UserAssociations",
        "Client",
        "ClientOperation",
        "Unit",
        "UnitOperation",
        "Equipment",
        "EquipmentOperation",
        "Modality",
        "Accessory",
        "Proposal",
        "Appointment",
        "Report",
        "Material",
    ],
    endpoints: (builder) => ({}),
});
