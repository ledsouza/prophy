import { useRouter } from "next/navigation";
import { buildStandardUrlParams } from "@/utils/url-params";

type UsePageNavigationConfig = {
    tabName: string;
    pageKey: string;
    buildFilters: () => Record<string, string>;
    setCurrentPage: (page: number) => void;
    /**
     * Optional explicit prefix for filter params.
     * If omitted, buildStandardUrlParams will fall back to tabName.
     */
    paramPrefix?: string;
};

/**
 * Hook for handling pagination within a tab.
 * Manages URL parameters and page state when navigating between pages.
 *
 * @param config - Configuration object for page navigation
 * @returns Object containing the handlePageChange function
 */
export function usePageNavigation(config: UsePageNavigationConfig) {
    const router = useRouter();

    const handlePageChange = (page: number) => {
        config.setCurrentPage(page);

        const filters = config.buildFilters();

        const params = buildStandardUrlParams({
            tabName: config.tabName,
            pageKey: config.pageKey,
            page,
            filters,
            paramPrefix: config.paramPrefix,
        });

        router.push(`?${params.toString()}`);
    };

    return { handlePageChange };
}
