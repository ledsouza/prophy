export enum SearchTab {
    CLIENTS = 0,
    EQUIPMENTS = 1,
    REPORTS = 2,
}

export const TAB_PARAM_VALUES = {
    [SearchTab.CLIENTS]: "clients",
    [SearchTab.EQUIPMENTS]: "equipments",
    [SearchTab.REPORTS]: "reports",
} as const;

export function getTabFromParam(tabParam: string | null): SearchTab {
    if (tabParam === "equipments") {
        return SearchTab.EQUIPMENTS;
    }
    if (tabParam === "reports") {
        return SearchTab.REPORTS;
    }
    return SearchTab.CLIENTS;
}
