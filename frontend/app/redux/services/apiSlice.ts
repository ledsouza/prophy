import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { setAuth, logout } from "../features/authSlice";
import { Mutex } from "async-mutex";

const baseUrl = `${process.env.NEXT_PUBLIC_HOST}/api/`;

const mutex = new Mutex();
const baseQuery = fetchBaseQuery({
  baseUrl: baseUrl,
  credentials: "include",
});

// Middleware for all apiSlice requests
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
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

export const getClienteByCnpj = async (cnpj: string) => {
  const response = await fetch(`${baseUrl}clientes/?cnpj=${cnpj}`);
  const data = await response.json();
  return data.results;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({}),
});
