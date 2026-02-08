import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { PaginatedResponse } from "./apiTypes";

/**
 * Creates a generic auto-paginating query function for Django REST Framework endpoints.
 *
 * This helper handles both single-page and multi-page fetching with optional filters
 *
 * @template TResult - The type of individual items in the result array
 * @template TFilters - The type of filter parameters (e.g., { unit?: number, equipment?: number })
 * @param endpoint - The API endpoint URL (e.g., "reports/", "visits/")
 * @returns An async queryFn compatible with RTK Query builder.query
 *
 * @example
 * ```typescript
 * listReports: builder.query<ReportDTO[], ListReportsArgs | void>({
 *     queryFn: createPaginatedQueryFn<ReportDTO, ListReportsArgs>("reports/"),
 *     providesTags: [{ type: "Report", id: "LIST" }],
 * }),
 * ```
 */
export function createPaginatedQueryFn<TResult, TFilters extends Record<string, any> = {}>(
    endpoint: string,
) {
    return async (
        args: ({ page: number } & TFilters) | TFilters | void,
        _queryApi: any,
        _extraOptions: any,
        baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>,
    ): Promise<{ data: TResult[] } | { error: FetchBaseQueryError }> => {
        // Extract page and filters from args
        const hasArgs = args && typeof args === "object";
        const explicitPage = hasArgs && "page" in args ? (args as any).page : undefined;

        // Build filter params (exclude 'page' from filters)
        const filters: Record<string, any> = {};
        if (hasArgs) {
            Object.entries(args).forEach(([key, value]) => {
                if (key !== "page" && value !== undefined) {
                    filters[key] = value;
                }
            });
        }

        // Helper to build params with optional page number
        const buildParams = (page?: number) => ({
            ...(page !== undefined && { page }),
            ...filters,
        });

        // If a specific page was requested, return only that page
        if (explicitPage !== undefined) {
            const response = await baseQuery(
                {
                    url: endpoint,
                    method: "GET",
                    params: buildParams(explicitPage),
                },
                _queryApi,
                _extraOptions,
            );

            if (response.error) return { error: response.error };

            const data = response.data as PaginatedResponse<TResult> | TResult[];

            // Handle both paginated and non-paginated responses
            if (Array.isArray(data)) {
                return { data };
            }
            if (data && "results" in data) {
                return { data: data.results };
            }
            return { data: [] };
        }

        // Otherwise, auto-paginate through all pages and merge results
        let all: TResult[] = [];
        let currentPage = 1;
        let hasNextPage = true;

        while (hasNextPage) {
            const response = await baseQuery(
                {
                    url: endpoint,
                    method: "GET",
                    params: buildParams(currentPage),
                },
                _queryApi,
                _extraOptions,
            );

            if (response.error) return { error: response.error };

            const data = response.data as PaginatedResponse<TResult> | TResult[];

            if (Array.isArray(data)) {
                // Non-paginated response (return as-is and stop)
                all = data;
                hasNextPage = false;
            } else if (data && "results" in data) {
                // Paginated response (accumulate and continue if there's a next page)
                all = [...all, ...data.results];
                hasNextPage = data.next !== null;
                currentPage++;
            } else {
                // Unexpected format (stop pagination)
                hasNextPage = false;
            }
        }

        return { data: all };
    };
}
