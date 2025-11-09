import { useRouter } from "next/navigation";
import { buildStandardUrlParams } from "@/utils/url-params";

type TabConfig = {
    tabName: string;
    pageKey: string;
    currentPage: number;
    buildFilters: () => Record<string, string>;
};

type UseTabNavigationConfig = Record<number, TabConfig>;

export function useTabNavigation(
    setSelectedTabIndex: (index: number) => void,
    tabConfigs: UseTabNavigationConfig
) {
    const router = useRouter();

    const handleTabChange = (index: number) => {
        setSelectedTabIndex(index);

        const config = tabConfigs[index];
        if (!config) return;

        const filters = config.buildFilters();

        const params = buildStandardUrlParams({
            tabName: config.tabName,
            pageKey: config.pageKey,
            page: config.currentPage,
            filters,
        });

        router.push(`?${params.toString()}`);
    };

    return { handleTabChange };
}
