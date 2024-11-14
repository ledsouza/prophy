export function getIdFromUrl(url: string) {
    // Split the URL into an array of segments
    const urlSegments = url.split("/");

    // Find the last segment, which should contain the ID
    const lastSegment = urlSegments[urlSegments.length - 2];

    return Number(lastSegment);
}
