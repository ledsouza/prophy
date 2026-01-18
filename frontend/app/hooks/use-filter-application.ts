import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { buildStandardUrlParams } from "@/utils/url-params";

/**
 * Configuration for the filter application hook
 */
type UseFilterApplicationConfig<TFilters extends Record<string, unknown>> = {
    tabName: string;
    pageKey: string;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    setAppliedFilters: (filters: TFilters) => void;
    buildFilters: () => TFilters;
    paramPrefix?: string;
    preserveParams?: string[];
};

/**
 * Custom hook for applying filters and updating URL parameters
 *
 * Encapsulates the common pattern of:
 * 1. Resetting page to 1
 * 2. Building filter object
 * 3. Updating applied filters state
 * 4. Building standardized URL parameters
 * 5. Navigating to the new URL
 *
 * @param config - Configuration object
 * @returns Object containing handleApplyFilters function
 */
export function useFilterApplication<TFilters extends Record<string, unknown>>(
    config: UseFilterApplicationConfig<TFilters>,
) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleApplyFilters = useCallback(() => {
        if (config.currentPage !== 1) {
            config.setCurrentPage(1);
        }

        const filters = config.buildFilters();
        config.setAppliedFilters(filters);

        const params = buildStandardUrlParams({
            tabName: config.tabName,
            pageKey: config.pageKey,
            page: 1,
            filters,
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

    return { handleApplyFilters };
}
