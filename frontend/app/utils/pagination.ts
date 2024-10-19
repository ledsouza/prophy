export const getPageNumber = (url: string): number | null => {
    const pageNumber = url.match(/page=(\d+)/);
    return pageNumber ? parseInt(pageNumber[1], 10) : null;
};
