import { restorePageState } from "@/utils/filter-restoration";
import { ReadonlyURLSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Configuration for a single tab's filter restoration.
 */
type TabFilterConfig = {
    /**
     * URL parameter name for pagination (e.g., "client_page").
     */
    pageParam: string;

    /**
     * Current page number for this tab.
     */
    currentPage: number;

    /**
     * Function to update the current page state.
     */
    setCurrentPage: (page: number) => void;

    /**
     * Function to restore all filters for this tab from URL parameters.
     * This includes text filters, select filters, and any special filters.
     */
    restoreFilters: (params: URLSearchParams) => void;

    /**
     * Function to set the applied filters state for this tab.
     */
    setAppliedFilters: (filters: any) => void;

    /**
     * Function to build the applied filters object from URL parameters.
     */
    buildAppliedFilters: (params: URLSearchParams) => any;
};

/**
 * Configuration for the useFilterRestoration hook.
 */
type UseFilterRestorationConfig = {
    /**
     * Next.js search params from useSearchParams().
     */
    searchParams: ReadonlyURLSearchParams;

    /**
     * Function to set the selected tab index.
     */
    setSelectedTabIndex: (index: number) => void;

    /**
     * Function to convert tab parameter string to tab index.
     */
    getTabFromParam: (param: string | null) => number;

    /**
     * Configuration for each tab, keyed by tab index.
     */
    tabs: Record<number, TabFilterConfig>;

    /**
     * Optional dependency token that should trigger re-restoration
     * when it changes. Callers can pass anything (including arrays)
     * and it will be treated as a single dependency value.
     */
    dependencies?: unknown;
};

/**
 * Reusable hook for restoring filters from URL search parameters.
 *
 * This hook encapsulates the common logic for:
 * - Restoring tab state from URL
 * - Restoring pagination state for each tab
 * - Restoring filter values from URL parameters
 * - Setting applied filters based on URL state
 *
 * It is intentionally idempotent: for a given combination of
 * `searchParams` and `dependencies`, it will only apply restoration
 * once, even if the component re-renders multiple times.
 */
export function useFilterRestoration({
    searchParams,
    setSelectedTabIndex,
    getTabFromParam,
    tabs,
    dependencies,
}: UseFilterRestorationConfig) {
    const lastKeyRef = useRef<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        const tabParam = params.get("tab");

        const searchKey = params.toString();
        const dependencyKey =
            dependencies === undefined || dependencies === null ? "" : String(dependencies);
        const combinedKey = `${searchKey}|${dependencyKey}`;

        if (lastKeyRef.current === combinedKey) {
            return;
        }

        lastKeyRef.current = combinedKey;

        setSelectedTabIndex(getTabFromParam(tabParam));

        Object.entries(tabs).forEach(([, tabConfig]) => {
            const pageParam = params.get(tabConfig.pageParam);

            restorePageState(pageParam, tabConfig.currentPage, tabConfig.setCurrentPage);

            tabConfig.restoreFilters(params);

            const appliedFilters = tabConfig.buildAppliedFilters(params);
            tabConfig.setAppliedFilters(appliedFilters);
        });
    }, [searchParams, setSelectedTabIndex, getTabFromParam, tabs, dependencies]);
}
