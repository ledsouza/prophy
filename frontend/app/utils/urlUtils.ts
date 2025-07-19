import { SearchTab, TAB_PARAM_VALUES } from "@/types/search";

export type FilterParams = {
    name?: string;
    cnpj?: string;
    city?: string;
    userRoleId?: number;
    contractTypeId?: number;
    operationStatusId?: number;
};

export const buildUrlParams = (
    filters: FilterParams,
    tabIndex: SearchTab,
    page: number = 1
): URLSearchParams => {
    const params = new URLSearchParams();

    if (filters.name) params.set("name", filters.name);
    if (filters.cnpj) params.set("cnpj", filters.cnpj);
    if (filters.city) params.set("city", filters.city);
    if (filters.userRoleId && filters.userRoleId !== 0)
        params.set("role", filters.userRoleId.toString());
    if (filters.contractTypeId && filters.contractTypeId !== 0)
        params.set("contract", filters.contractTypeId.toString());
    if (filters.operationStatusId && filters.operationStatusId !== 0)
        params.set("status", filters.operationStatusId.toString());

    params.set("tab", TAB_PARAM_VALUES[tabIndex]);
    params.set("page", page.toString());

    return params;
};

export const getTabFromParam = (tabParam: string | null): SearchTab => {
    return tabParam === "equipments" ? SearchTab.EQUIPMENTS : SearchTab.CLIENTS;
};
