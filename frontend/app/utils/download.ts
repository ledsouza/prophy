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

/**
 * Extracts filename from Content-Disposition HTTP header.
 *
 * Supports both simple filename= and RFC 5987 filename*= formats.
 *
 * @param contentDisposition - The Content-Disposition header value.
 * @returns The extracted filename, or null if not found.
 *
 * @example
 * extractFilenameFromContentDisposition('attachment; filename="report.pdf"')
 * // Returns: "report.pdf"
 *
 * @example
 * extractFilenameFromContentDisposition("attachment; filename*=UTF-8''report%20file.pdf")
 * // Returns: "report file.pdf"
 */
export function extractFilenameFromContentDisposition(
    contentDisposition: string | null
): string | null {
    if (!contentDisposition) return null;

    // Try RFC 5987 format first: filename*=UTF-8''filename.pdf
    const filenameStarMatch = contentDisposition.match(/filename\*=(?:UTF-8'')(.+)/i);
    if (filenameStarMatch) {
        try {
            return decodeURIComponent(filenameStarMatch[1]);
        } catch {
            // Fall through to simple format
        }
    }

    // Try simple format: filename="filename.pdf" or filename=filename.pdf
    const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/i);
    if (filenameMatch) {
        return filenameMatch[1].trim();
    }

    return null;
}

/**
 * Downloads a blob using the filename from Content-Disposition header.
 *
 * Convenience wrapper that combines filename extraction and download.
 *
 * @param params - Download parameters.
 * @param params.blob - The blob data to download.
 * @param params.contentDisposition - The Content-Disposition header value.
 * @param params.fallbackFilename - Filename to use if extraction fails.
 *
 * @example
 * downloadBlobFromContentDisposition({
 *   blob: myBlob,
 *   contentDisposition: response.headers.get("content-disposition"),
 *   fallbackFilename: "report-123.pdf"
 * })
 */
export function downloadBlobFromContentDisposition(params: {
    blob: Blob;
    contentDisposition: string | null;
    fallbackFilename: string;
}): void {
    const { blob, contentDisposition, fallbackFilename } = params;
    const filename = extractFilenameFromContentDisposition(contentDisposition) || fallbackFilename;
    downloadBlob(blob, filename);
}
