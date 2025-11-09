export enum SearchTab {
    CLIENTS = 0,
    PROPOSALS = 1,
}

export const TAB_PARAM_VALUES = {
    [SearchTab.CLIENTS]: "clients",
    [SearchTab.PROPOSALS]: "proposals",
} as const;

export function getTabFromParam(tabParam: string | null): SearchTab {
    if (tabParam === "proposals") {
        return SearchTab.PROPOSALS;
    }
    return SearchTab.CLIENTS;
}
