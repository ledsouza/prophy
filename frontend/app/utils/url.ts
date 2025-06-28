export function getIdFromUrl(url: string) {
    // Split the URL into an array of segments, filtering out empty strings
    const urlSegments = url.split("/").filter((segment) => segment !== "");

    // Find the last segment, which should contain the ID
    const lastSegment = urlSegments[urlSegments.length - 1];

    return Number(lastSegment);
}
