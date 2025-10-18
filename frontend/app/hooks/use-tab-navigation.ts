import { useRouter } from "next/navigation";

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
        const params = new URLSearchParams();
        setSelectedTabIndex(index);

        const config = tabConfigs[index];
        if (!config) return;

        params.set("tab", config.tabName);
        params.set(config.pageKey, String(config.currentPage));

        const filters = config.buildFilters();
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== "Todos" && value !== "0") {
                params.set(key, value);
            }
        });

        router.push(`?${params.toString()}`);
    };

    return { handleTabChange };
}
