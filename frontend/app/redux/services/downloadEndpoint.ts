import { downloadBlob, downloadBlobFromContentDisposition } from "@/utils/download";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * Shared RTK Query helper for file-download endpoints.
 *
 * Instead of returning a `Blob` from an endpoint and letting it flow
 * through Redux actions/state, this helper performs the browser download
 * as a side effect and returns only a serializable success result.
 *
 * This avoids Redux Toolkit warnings about non-serializable values while
 * keeping download behavior centralized and reusable across features.
 */

type DownloadSuccessResult = {
    success: boolean;
};

type DownloadLogAdapter<TArg> = {
    info: (context: Record<string, unknown>, message: string) => void;
    error: (context: Record<string, unknown>, message: string) => void;
};

type CreateDownloadQueryFnConfig<TArg> = {
    buildRequest: (arg: TArg) => FetchArgs;
    getFallbackFilename: (arg: TArg) => string;
    getLogContext?: (arg: TArg) => Record<string, unknown>;
    log: DownloadLogAdapter<TArg>;
    successMessage: string;
    errorMessage: string;
    preferContentDisposition?: boolean;
};

type QueryFnResult = { data: DownloadSuccessResult } | { error: FetchBaseQueryError };

/**
 * Creates an RTK Query `queryFn` specialized for binary downloads.
 *
 * The generated query function:
 * - executes the request using the shared `baseQuery`
 * - reads the response as a `Blob`
 * - optionally extracts the filename from `Content-Disposition`
 * - triggers the browser download immediately
 * - returns only `{ success: true }` to keep Redux payloads serializable
 *
 * This should be used for endpoints whose goal is to download a file,
 * not to keep binary response data in RTK Query cache.
 *
 * @typeParam TArg - Endpoint argument type, such as an entity id or a
 *   request object.
 * @param config - Download endpoint configuration.
 * @param config.buildRequest - Builds the HTTP request passed to
 *   `baseQuery`.
 * @param config.getFallbackFilename - Returns a deterministic filename
 *   when the server does not provide one.
 * @param config.getLogContext - Returns structured metadata used in logs.
 * @param config.log - Feature-scoped logger adapter.
 * @param config.successMessage - Log message emitted on success.
 * @param config.errorMessage - Log message emitted on failure.
 * @param config.preferContentDisposition - When true, prefers the filename
 *   declared by the backend in the `Content-Disposition` header.
 * @returns An RTK Query-compatible `queryFn`.
 *
 * @example
 * ```ts
 * downloadServiceOrderPDF: builder.query<DownloadSuccessResult, number>({
 *     queryFn: createDownloadQueryFn<number>({
 *         buildRequest: (id) => ({
 *             url: `service-orders/${id}/pdf/`,
 *             method: "GET",
 *         }),
 *         getFallbackFilename: (id) => `service_order_${id}.pdf`,
 *         getLogContext: (id) => ({ serviceOrderId: id }),
 *         log,
 *         successMessage: "Service order PDF downloaded successfully",
 *         errorMessage: "Failed to download service order PDF",
 *     }),
 * })
 * ```
 */
export function createDownloadQueryFn<TArg>(config: CreateDownloadQueryFnConfig<TArg>) {
    return async (
        arg: TArg,
        api: Parameters<BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>>[1],
        extraOptions: Parameters<BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>>[2],
        baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>,
    ): Promise<QueryFnResult> => {
        const logContext = config.getLogContext?.(arg) ?? {};

        try {
            const result = await baseQuery(
                {
                    ...config.buildRequest(arg),
                    responseHandler: async (response) => {
                        const contentDisposition = response.headers.get("content-disposition");
                        const blob = await response.blob();

                        return {
                            blob,
                            contentDisposition,
                        };
                    },
                },
                api,
                extraOptions,
            );

            if (result.error) {
                config.log.error({ ...logContext, error: result.error }, config.errorMessage);
                return { error: result.error };
            }

            const { blob, contentDisposition } = result.data as {
                blob: Blob;
                contentDisposition: string | null;
            };

            if (config.preferContentDisposition) {
                downloadBlobFromContentDisposition({
                    blob,
                    contentDisposition,
                    fallbackFilename: config.getFallbackFilename(arg),
                });
            } else {
                downloadBlob(blob, config.getFallbackFilename(arg));
            }

            config.log.info(logContext, config.successMessage);

            return { data: { success: true } };
        } catch (error) {
            const queryError: FetchBaseQueryError = {
                status: "CUSTOM_ERROR",
                error: String(error),
            };

            config.log.error({ ...logContext, error }, config.errorMessage);

            return { error: queryError };
        }
    };
}

export type { DownloadSuccessResult };
