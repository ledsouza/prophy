export enum SearchTab {
    CLIENTS = 0,
    EQUIPMENTS = 1,
    APPOINTMENTS = 2,
    REPORTS = 3,
}

export const TAB_PARAM_VALUES = {
    [SearchTab.CLIENTS]: "clients",
    [SearchTab.EQUIPMENTS]: "equipments",
    [SearchTab.APPOINTMENTS]: "appointments",
    [SearchTab.REPORTS]: "reports",
} as const;

export function getTabFromParam(tabParam: string | null): SearchTab {
    if (tabParam === "equipments") {
        return SearchTab.EQUIPMENTS;
    }
    if (tabParam === TAB_PARAM_VALUES[SearchTab.APPOINTMENTS]) {
        return SearchTab.APPOINTMENTS;
    }
    if (tabParam === "reports") {
        return SearchTab.REPORTS;
    }
    return SearchTab.CLIENTS;
}
