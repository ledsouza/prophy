import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * Type predicate to narrow an unknown error to `FetchBaseQueryError`
 */
export function isFetchBaseQueryError(
    error: unknown
): error is FetchBaseQueryError {
    return typeof error === "object" && error != null && "status" in error;
}

/**
 * Type predicate to narrow an unknown error to an object with a string 'message' property
 */
export function isErrorWithMessage(
    error: unknown
): error is { data: { message: string[] } } {
    return (
        typeof error === "object" &&
        error != null &&
        "data" in error &&
        typeof (error as any).data === "object"
    );
}

export function isResponseError(
    error: unknown
): error is { error: { data: { message: string }; status: number } } {
    return (
        typeof error === "object" &&
        error != null &&
        "error" in error &&
        typeof (error as any).error === "object" &&
        "data" in (error as any).error &&
        "status" in (error as any).error
    );
}
