/**
 * Options controlling how plain objects are serialized into FormData.
 *
 * Defaults are chosen to be DRF-friendly and predictable:
 * - Keys default to camelCase -> snake_case via camelToSnake
 * - Arrays repeat the same key per element
 * - Booleans are serialized as "true" | "false" by default
 * - null/undefined handling avoids sending meaningless fields unless requested
 */
export type ToFormDataOptions = {
    /**
     * Optional map of input keys to target keys before any transformation.
     * Useful to align UI field names with backend expectations.
     * Example: { firstName: "first_name" }
     */
    keyMap?: Record<string, string>;

    /**
     * Key transformer applied after keyMap. If omitted, keys are transformed
     * by default with camelToSnake.
     */
    transformKey?: (k: string) => string;

    /**
     * How to serialize booleans.
     * - "string": "true" | "false" (default)
     * - "number": "1" | "0"
     */
    boolMode?: "string" | "number"; // default: "string"

    /**
     * How to handle null values.
     * - "skip" (default): do not append the key at all
     * - "empty": append key with an empty string value
     */
    nullMode?: "skip" | "empty"; // default: "skip"

    /**
     * How to serialize FileList.
     * - "first" (default): append only the first file
     * - "all": append every file (repeating the same key)
     */
    fileListMode?: "first" | "all"; // default: "first"
};

/**
 * Best-effort camelCase -> snake_case converter.
 * Inserts an underscore before each uppercase character and lowercases it.
 * Example: "firstName" -> "first_name".
 * Note: This is a simple transformer and not a locale-aware converter.
 */
export const camelToSnake = (s: string): string =>
    s.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);

// Internal helper that applies serialization rules consistently.
const appendValue = (form: FormData, key: string, value: unknown, opts: ToFormDataOptions) => {
    // Avoid sending meaningless fields; undefined is always omitted
    if (value === undefined) return;

    // Allow explicit signaling for nulls when desired; otherwise skip to keep payloads small
    if (value === null) {
        if (opts.nullMode === "empty") form.append(key, "");
        return; // default: skip
    }

    // Preserve binary types so the browser handles multipart boundaries/content-type
    if (value instanceof Blob) {
        form.append(key, value);
        return;
    }

    // Support single/multiple file uploads by repeating the same key per file
    if (typeof FileList !== "undefined" && value instanceof FileList) {
        if (opts.fileListMode === "all") {
            Array.from(value).forEach((f) => form.append(key, f));
        } else if (value.length > 0) {
            form.append(key, value[0]);
        }
        return;
    }

    // Use ISO 8601 for portability across backends
    if (value instanceof Date) {
        form.append(key, value.toISOString());
        return;
    }

    // DRF-friendly convention: repeat key for each element
    if (Array.isArray(value)) {
        value.forEach((v) => appendValue(form, key, v, opts));
        return;
    }

    // Allow numeric-style boolean representation when callers need 1/0 semantics
    if (typeof value === "boolean") {
        const serialized = opts.boolMode === "number" ? (value ? "1" : "0") : String(value);
        form.append(key, serialized);
        return;
    }

    // Fallback: stringify primitives/objects
    form.append(key, String(value));
};

/**
 * Convert a flat record to FormData, applying optional key mapping, key transformation,
 * and value serialization policies.
 *
 * Behavior summary
 * - Keys: keyMap is applied first; then transformKey (defaults to camelToSnake).
 * - Arrays: the same key is appended once per element.
 * - Booleans: "true"/"false" by default, or "1"/"0" when boolMode === "number".
 * - Dates: serialized with toISOString().
 * - null: skipped by default; when nullMode === "empty" an empty string is appended.
 * - undefined: always skipped.
 * - File/FileList: appended directly; FileList supports "first" | "all" modes.
 *
 * @param data A flat record to serialize.
 * @param opts Serialization options; see ToFormDataOptions. Defaults noted above.
 * @returns FormData ready for multipart/form-data submissions.
 *
 * @example
 * const fd = toFormData(
 *   {
 *     firstName: "Ana",          // -> "first_name" by default
 *     tags: ["a", "b"],         // repeats key per element
 *     acceptTerms: true,          // "true" by default; use boolMode: "number" for "1"
 *     avatar: fileInput.files,    // FileList
 *   },
 *   {
 *     boolMode: "number",        // "1" | "0"
 *     fileListMode: "all",       // append all files
 *     // keyMap: { firstName: "first_name" }, // optional explicit remap
 *     // transformKey: (k) => k,               // override default camelToSnake
 *   }
 * );
 */
export function toFormData(data: Record<string, unknown>, opts: ToFormDataOptions = {}): FormData {
    const form = new FormData();

    const transformKey = (k: string): string => {
        const mapped = opts.keyMap?.[k] ?? k;
        const transformer = opts.transformKey ?? camelToSnake;
        return transformer(mapped);
    };

    const effective: ToFormDataOptions = {
        boolMode: opts.boolMode ?? "string",
        nullMode: opts.nullMode ?? "skip",
        fileListMode: opts.fileListMode ?? "first",
        keyMap: opts.keyMap,
        transformKey: opts.transformKey ?? camelToSnake,
    };

    Object.entries(data).forEach(([rawKey, value]) => {
        const key = transformKey(rawKey);
        appendValue(form, key, value, effective);
    });

    return form;
}
