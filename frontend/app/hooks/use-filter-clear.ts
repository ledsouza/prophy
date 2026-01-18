import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { buildStandardUrlParams } from "@/utils/url-params";

/**
 * Configuration for the filter clear hook
 */
type UseFilterClearConfig<TFilters extends Record<string, unknown>> = {
    tabName: string;
    pageKey: string;
    setCurrentPage: (page: number) => void;
    setAppliedFilters: (filters: TFilters) => void;
    resetFilters: () => void;
    emptyFilters: TFilters;
    paramPrefix?: string;
    preserveParams?: string[];
};

/**
 * Custom hook for clearing filters and resetting URL parameters
 *
 * Encapsulates the common pattern of:
 * 1. Resetting all filter UI state (via resetFilters callback)
 * 2. Resetting page to 1
 * 3. Clearing applied filters state
 * 4. Building standardized URL parameters with empty filters
 * 5. Navigating to the new URL
 *
 * @param config - Configuration object
 * @returns Object containing handleClearFilters function
 */
export function useFilterClear<TFilters extends Record<string, unknown>>(
    config: UseFilterClearConfig<TFilters>,
) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleClearFilters = useCallback(() => {
        config.resetFilters();
        config.setCurrentPage(1);
        config.setAppliedFilters(config.emptyFilters);

        const params = buildStandardUrlParams({
            tabName: config.tabName,
            pageKey: config.pageKey,
            page: 1,
            filters: {},
            paramPrefix: config.paramPrefix,
        });

        (config.preserveParams ?? []).forEach((key) => {
            const value = searchParams.get(key);
            if (value) {
                params.set(key, value);
            }
        });

        router.push(`?${params.toString()}`, { scroll: false });
    }, [config, router, searchParams]);

    return { handleClearFilters };
}
