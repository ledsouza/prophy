/**
 * Triggers a browser download for a blob with the specified filename.
 *
 * Creates a temporary object URL, generates a download link,
 * simulates a click, and properly cleans up resources.
 *
 * @param blob - The blob data to download.
 * @param filename - The name to use for the downloaded file.
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

/**
 * Extracts the filename from a file path, with a fallback.
 *
 * @param filePath - The full file path (e.g., "/media/reports/file.pdf").
 * @param fallbackPrefix - Prefix for the fallback filename (e.g., "report").
 * @param fallbackId - ID to use in the fallback filename.
 * @returns The extracted filename or a generated fallback.
 *
 * @example
 * extractFilenameFromPath("/media/reports/annual.pdf", "report", 123)
 * // Returns: "annual.pdf"
 *
 * @example
 * extractFilenameFromPath("", "report", 123)
 * // Returns: "report-123.pdf"
 */
export function extractFilenameFromPath(
    filePath: string,
    fallbackPrefix: string,
    fallbackId: string | number
): string {
    const urlParts = filePath.split("/");
    const filename = urlParts[urlParts.length - 1];
    return filename || `${fallbackPrefix}-${fallbackId}.pdf`;
}
