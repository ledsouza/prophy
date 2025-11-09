/**
 * Shared utility functions for filter restoration from URL parameters.
 *
 * These functions are used by the useFilterRestoration hook and can be
 * imported directly by pages that need page-specific restoration logic.
 */

/**
 * Restores the selected tab index from a URL parameter.
 *
 * @param tabParam - The tab parameter from URL (e.g., "clients", "equipments")
 * @param setSelectedTabIndex - Function to update the selected tab index
 * @param getTabFromParam - Function to convert tab parameter string to tab index
 */
export const restoreTabState = (
    tabParam: string | null,
    setSelectedTabIndex: (index: number) => void,
    getTabFromParam?: (param: string | null) => number
) => {
    if (getTabFromParam) {
        setSelectedTabIndex(getTabFromParam(tabParam));
    } else {
        // Default to 0 if no conversion function provided
        setSelectedTabIndex(0);
    }
};

/**
 * Restores the current page number from a URL parameter.
 *
 * @param pageParam - The page parameter from URL (e.g., "1", "2")
 * @param currentPage - The current page number in state
 * @param setCurrentPage - Function to update the current page
 */
export const restorePageState = (
    pageParam: string | null,
    currentPage: number,
    setCurrentPage: (page: number) => void
) => {
    if (pageParam) {
        const page = parseInt(pageParam, 10);
        if (page > 0 && page !== currentPage) {
            setCurrentPage(page);
        }
    }
};

/**
 * Resets the current page to 1 if it's not already 1.
 *
 * @param currentPage - The current page number in state
 * @param setCurrentPage - Function to update the current page
 */
export const resetPageState = (currentPage: number, setCurrentPage: (page: number) => void) => {
    if (currentPage !== 1) {
        setCurrentPage(1);
    }
};

/**
 * Restores a text filter state from a URL parameter value.
 *
 * @param state - The filter value from URL
 * @param setState - Function to update the filter state
 */
export const restoreTextFilterStates = (state: string, setState: (state: string) => void) => {
    if (state) {
        setState(state);
    }
};

/**
 * Restores a select filter state from a URL parameter ID.
 *
 * @param id - The option ID from URL
 * @param options - Available select options
 * @param setData - Function to update the selected option
 */
export const restoreSelectFilterStates = <T extends { id: number; value: string }>(
    id: string | null,
    options: T[],
    setData: (option: T) => void
) => {
    const selectedID = id ? options.find((option) => option.id === Number(id)) : null;
    if (selectedID) setData(selectedID);
};
