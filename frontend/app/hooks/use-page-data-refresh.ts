import { useCallback, useState } from "react";
import { toast } from "react-toastify";

import { useAppDispatch } from "@/redux/hooks";
import { apiSlice } from "@/redux/services/apiSlice";
import { handleApiError } from "@/redux/services/errorHandling";
import type { RootState } from "@/redux/store";

type InvalidateTag = Parameters<typeof apiSlice.util.invalidateTags>[0][number];

type GenericQueryEndpoint = {
    initiate: (
        arg: unknown,
        options: { subscribe: boolean; forceRefetch: boolean },
    ) => unknown;
    select: (arg: unknown) => (state: RootState) => { data?: unknown };
};

type GenericDispatch = (action: unknown) => { unwrap: () => Promise<unknown> };

/**
 * Force-refetches whatever cache entries the given tags would invalidate
 * and reports the outcome via toast (changed / unchanged / errored).
 *
 * Uses `apiSlice.util.selectInvalidatedBy` instead of hardcoding endpoint
 * names, so the same hook works for any page's tag list without knowing
 * which queries/args back those tags.
 */
export function usePageDataRefresh(tags: InvalidateTag[]) {
    const dispatch = useAppDispatch();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleUpdateData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const state = dispatch((_dispatch, getState) => getState()) as RootState;
            const invalidatedEntries = apiSlice.util.selectInvalidatedBy(state, tags);

            if (invalidatedEntries.length === 0) {
                toast.info("Nenhuma atualização encontrada.");
                return;
            }

            const endpoints = apiSlice.endpoints as unknown as Record<
                string,
                GenericQueryEndpoint
            >;
            const genericDispatch = dispatch as unknown as GenericDispatch;

            const outcomes = await Promise.all(
                invalidatedEntries.map(async ({ endpointName, originalArgs }) => {
                    const endpoint = endpoints[endpointName];
                    const previousData = endpoint.select(originalArgs)(state).data;
                    const data = await genericDispatch(
                        endpoint.initiate(originalArgs, {
                            subscribe: false,
                            forceRefetch: true,
                        }),
                    ).unwrap();
                    return { previousData, data };
                }),
            );

            // Serialized comparison assumes stable ordering/key order from
            // the backend between calls, which holds since both snapshots
            // come from the same endpoint/serializer.
            const hasNewData = outcomes.some(
                ({ previousData, data }) =>
                    JSON.stringify(data) !== JSON.stringify(previousData),
            );

            if (hasNewData) {
                toast.success("Dados atualizados com sucesso!");
            } else {
                toast.info("Nenhuma atualização encontrada.");
            }
        } catch (error) {
            handleApiError(error, "Page data refresh error");
        } finally {
            setIsRefreshing(false);
        }
    }, [dispatch, tags]);

    return { handleUpdateData, isRefreshing };
}
