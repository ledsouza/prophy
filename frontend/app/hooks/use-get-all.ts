import { useEffect, useRef, useState } from "react";
import { getPageNumber } from "@/utils/pagination";
import { QueryActionCreatorResult } from "@reduxjs/toolkit/query";
import { ListQueryParams } from "@/redux/services/apiSlice";

// Generic type for paginated response
type PaginatedResponse<T> = {
    results: T[];
    next?: string | null;
} & Record<string, any>;

type UseQueryResult<T> = {
    // Base query state
    originalArgs?: unknown; // Arguments passed to the query
    data?: T; // The latest returned result regardless of hook arg, if present
    currentData?: T; // The latest returned result for the current hook arg, if present
    error?: unknown; // Error result if present
    requestId?: string; // A string generated by RTK Query
    endpointName?: string; // The name of the given endpoint for the query
    startedTimeStamp?: number; // Timestamp for when the query was initiated
    fulfilledTimeStamp?: number; // Timestamp for when the query was completed

    // Derived request status booleans
    isUninitialized: boolean; // Query has not started yet.
    isLoading: boolean; // Query is currently loading for the first time. No data yet.
    isFetching: boolean; // Query is currently fetching, but might have data from an earlier request.
    isSuccess: boolean; // Query has data from a successful load.
    isError: boolean; // Query is currently in an "error" state.

    refetch: () => QueryActionCreatorResult<any>; // A function to force refetch the query - returns a Promise with additional methods
};

// Generic hook type
type UseGetAllHookProps<T> = {
    queryHook: (args: { page: number }) => UseQueryResult<PaginatedResponse<T>>;
};

function useGetAll<T>(queryHook: UseGetAllHookProps<T>["queryHook"]) {
    const [page, setPage] = useState(1);
    const [processedPages, setProcessedPages] = useState<number[]>([]);
    const [isPaginating, setIsPaginating] = useState(true);
    const [allData, setAllData] = useState<T[]>([]);
    const {
        data,
        error,
        isLoading,
        isSuccess,
        isFetching,
        refetch,
        originalArgs,
        requestId,
        endpointName,
    } = queryHook({ page });

    const prevCompletedRef = useRef<boolean>(false);
    const prevRequestIdRef = useRef<string | undefined>(undefined);
    const prevOriginalArgsRef = useRef<ListQueryParams | undefined>(undefined);

    // Detect when to reset the state due to tag invalidation
    useEffect(() => {
        if (
            prevCompletedRef.current &&
            (prevRequestIdRef.current !== requestId ||
                prevOriginalArgsRef.current !== originalArgs)
        ) {
            // Reset state and restart pagination only if a completed cycle was invalidated
            // console.log("Tag invalidation detected, resetting pagination.");
            setPage(1);
            setProcessedPages([]);
            setAllData([]);
            setIsPaginating(true);
        }

        prevRequestIdRef.current = requestId;
        prevOriginalArgsRef.current = originalArgs as ListQueryParams;
        prevCompletedRef.current = !isPaginating; // Track whether the cycle is complete
    }, [requestId, originalArgs, isPaginating]);

    // Fetch all data from all pages
    useEffect(() => {
        if (
            isLoading ||
            !isPaginating ||
            !data ||
            !isSuccess ||
            processedPages.includes(page)
        ) {
            return;
        }
        const nextPage = data.next ? getPageNumber(data.next) : null;

        setProcessedPages((prevPages) => {
            if (prevPages.includes(page)) {
                return prevPages;
            }
            return [...prevPages, page];
        });

        setAllData((prevData) => {
            const existingIds = new Set(
                prevData.map((item) => (item as any).id)
            );
            const newItems = data.results.filter(
                (item) => !existingIds.has((item as any).id)
            );
            return [...prevData, ...newItems];
        });

        if (nextPage && nextPage > page) {
            setPage(nextPage);
        } else {
            setIsPaginating(false);
        }
    }, [data, isSuccess, isLoading, page, processedPages, isPaginating]);

    return {
        items: allData,
        isLoading: isPaginating,
        error,
        refetch,
    };
}

export default useGetAll;
