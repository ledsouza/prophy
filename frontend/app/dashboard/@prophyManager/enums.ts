export enum SearchTab {
    CLIENTS = 0,
    EQUIPMENTS = 1,
}

export const TAB_PARAM_VALUES = {
    [SearchTab.CLIENTS]: "clients",
    [SearchTab.EQUIPMENTS]: "equipments",
} as const;

export function getTabFromParam(tabParam: string | null): SearchTab {
    if (tabParam === "equipments") {
        return SearchTab.EQUIPMENTS;
    }
    return SearchTab.CLIENTS;
}
