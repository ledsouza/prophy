export enum SearchTab {
    CLIENTS = 0,
    EQUIPMENTS = 1,
}

export const TAB_PARAM_VALUES = {
    [SearchTab.CLIENTS]: "clients",
    [SearchTab.EQUIPMENTS]: "equipments",
} as const;
