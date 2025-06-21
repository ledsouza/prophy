import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { setAuth, logout } from "../features/authSlice";
import { Mutex } from "async-mutex";
import { OperationStatus, OperationType } from "@/enums";

export type PaginatedResponse<T> = {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
};

export type ListQueryParams = {
    page?: number;
};

export type Operation = {
    operation_type: OperationType;
    operation_status: OperationStatus;
    note?: string;
};

export type APIDeleteResponse = {
    message: string;
    id: number;
    operation_type: string;
};

const baseUrl = `${process.env.NEXT_PUBLIC_HOST}/api/`;

const mutex = new Mutex();
const baseQuery = fetchBaseQuery({
    baseUrl: baseUrl,
    credentials: "include",
});

// Middleware for all apiSlice requests
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions
) => {
    await mutex.waitForUnlock();
    let result = await baseQuery(args, api, extraOptions);
    if (result.error && result.error.status === 401) {
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
                    extraOptions
                );
                if (refreshResult.data) {
                    api.dispatch(setAuth());
                    result = await baseQuery(args, api, extraOptions);
                } else {
                    api.dispatch(logout());
                }
            } finally {
                release();
            }
            // If the middleware is running, wait until finish and retry request
        } else {
            await mutex.waitForUnlock();
            result = await baseQuery(args, api, extraOptions);
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
        "Client",
        "ClientOperation",
        "Unit",
        "UnitOperation",
        "Equipment",
        "EquipmentOperation",
        "Modality",
        "Accessory",
        "Proposal",
    ],
    endpoints: (builder) => ({}),
});
