import zxcvbn from "zxcvbn";

export const checkPasswordScore = (password: string) => {
    const result = zxcvbn(password);
    return result.score > 1;
};

export const isValidPhonePTBR = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, "");
    const mobileRegex = /^([1-9]{2})(9[0-9]{8})$/;
    const fixedRegex = /^([1-9]{2})([2-5][0-9]{7})$/;

    return mobileRegex.test(cleanPhone) || fixedRegex.test(cleanPhone);
};

/**
 * Type guard for FileList.
 */
const isFileList = (v: unknown): v is FileList =>
    typeof FileList !== "undefined" && v instanceof FileList;

/**
 * Type guard for File.
 */
const isFile = (v: unknown): v is File => typeof File !== "undefined" && v instanceof File;

/**
 * Extracts the first File from File | FileList | undefined.
 * Returns undefined if no file is present.
 */
export const getFirstFile = (input: unknown): File | undefined => {
    if (isFile(input)) return input;
    if (isFileList(input)) return input.length > 0 ? input[0] : undefined;
    return undefined;
};

/**
 * Checks if form data has changed from its initial state.
 * * @param initial - The original data (e.g., from query).
 * @param current - The current form data.
 * @param fileKeys - An array of keys that represent file inputs.
 * If any of these have a new File, it counts as a change.
 */
export function hasChanges(
    initial: Record<string, unknown>,
    current: Record<string, unknown>,
    fileKeys: string[] = []
): boolean {
    // Any new file selection immediately counts as a change.
    for (const key of fileKeys) {
        const fileCandidate = current[key] as unknown;
        const first = getFirstFile(fileCandidate);
        if (first instanceof File) {
            return true;
        }
    }

    const keys = new Set([...Object.keys(initial), ...Object.keys(current)]);

    for (const k of Array.from(keys)) {
        if (fileKeys.includes(k)) {
            continue;
        }

        const a = initial[k];
        const b = current[k];
        if (a !== b) {
            return true;
        }
    }

    return false;
}
