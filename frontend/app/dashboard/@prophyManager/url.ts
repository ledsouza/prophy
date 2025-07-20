import { URLSearchParams } from "url";
import { SearchTab } from "./enums";

export const buildUrlParams = (
    params: URLSearchParams,
    tab: string,
    page: number,
    filters: Record<string, string>
): URLSearchParams => {
    params.set("tab", tab);

    if (tab === "clients") {
        params.set("client_page", String(page));
    } else if (tab === "equipments") {
        params.set("equipment_page", String(page));
    }

    Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "Todos" && value !== "0") {
            params.set(key, value);
        }
    });

    return params;
};

export const getTabFromParam = (tabParam: string | null): SearchTab => {
    return tabParam === "equipments" ? SearchTab.EQUIPMENTS : SearchTab.CLIENTS;
};
