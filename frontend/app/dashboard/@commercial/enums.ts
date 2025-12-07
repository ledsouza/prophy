export enum SearchTab {
    CLIENTS = 0,
    PROPOSALS = 1,
    APPOINTMENTS = 2,
}

export const TAB_PARAM_VALUES = {
    [SearchTab.CLIENTS]: "clients",
    [SearchTab.PROPOSALS]: "proposals",
    [SearchTab.APPOINTMENTS]: "appointments",
} as const;

export function getTabFromParam(tabParam: string | null): SearchTab {
    if (tabParam === TAB_PARAM_VALUES[SearchTab.PROPOSALS]) {
        return SearchTab.PROPOSALS;
    }

    if (tabParam === TAB_PARAM_VALUES[SearchTab.APPOINTMENTS]) {
        return SearchTab.APPOINTMENTS;
    }

    return SearchTab.CLIENTS;
}
