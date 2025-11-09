import { useRouter } from "next/navigation";

type UsePageNavigationConfig = {
    tabName: string;
    pageKey: string;
    buildFilters: () => Record<string, string>;
    setCurrentPage: (page: number) => void;
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
        const params = new URLSearchParams();
        config.setCurrentPage(page);

        params.set("tab", config.tabName);
        params.set(config.pageKey, String(page));

        const filters = config.buildFilters();
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== "Todos" && value !== "0") {
                params.set(key, value);
            }
        });

        router.push(`?${params.toString()}`);
    };

    return { handlePageChange };
}
