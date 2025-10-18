import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { buildStandardUrlParams } from "@/utils/url-params";
import { resetPageState } from "@/dashboard/@prophyManager/state";

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
    config: UseFilterApplicationConfig<TFilters>
) {
    const router = useRouter();

    const handleApplyFilters = useCallback(() => {
        resetPageState(config.currentPage, config.setCurrentPage);

        const filters = config.buildFilters();
        config.setAppliedFilters(filters);

        const params = buildStandardUrlParams({
            tabName: config.tabName,
            pageKey: config.pageKey,
            page: 1,
            filters,
            paramPrefix: config.paramPrefix,
        });

        router.push(`?${params.toString()}`);
    }, [config, router]);

    return { handleApplyFilters };
}
