/**
 * Configuration for building standardized URL parameters
 */
export type UrlParamConfig = {
    tabName: string;
    pageKey: string;
    page: number;
    filters: Record<string, unknown>;
    paramPrefix?: string;
};

/**
 * Builds standardized URL parameters for filter applications
 *
 * Parameters are prefixed with the tab name to avoid conflicts between tabs
 * and make URLs more explicit about which tab the parameters belong to.
 *
 * @param config - Configuration object for URL building
 * @returns URLSearchParams object with standardized parameters
 */
export const buildStandardUrlParams = (config: UrlParamConfig): URLSearchParams => {
    const params = new URLSearchParams();
    const prefix = config.paramPrefix ?? config.tabName;

    params.set("tab", config.tabName);
    params.set(config.pageKey, String(config.page));

    Object.entries(config.filters).forEach(([key, value]) => {
        if (value && value !== "" && value !== "Todos" && value !== 0) {
            params.set(`${prefix}_${key}`, String(value));
        }
    });

    return params;
};
