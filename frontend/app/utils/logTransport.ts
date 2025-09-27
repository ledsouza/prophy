"use client";

/**
 * Lightweight transport for optionally shipping client logs to a remote endpoint.
 *
 * Why:
 * - This app is fully client-side (no Next.js server routes).
 * - When configured, we ship logs to a Django endpoint for centralized collection.
 *
 * How:
 * - Uses navigator.sendBeacon when available for non-blocking, best-effort delivery.
 * - Falls back to fetch with keepalive=true to avoid blocking page unloads.
 *
 * Env:
 * - NEXT_PUBLIC_LOG_ENDPOINT: optional URL to receive logs (e.g., https://api.example.com/logs)
 */

const endpoint = process.env.NEXT_PUBLIC_LOG_ENDPOINT;

/**
 * Checks if a remote endpoint is configured for log shipping.
 */
export function hasEndpoint(): boolean {
    return Boolean(endpoint && endpoint.length > 0);
}

/**
 * Sends a single log payload to the configured endpoint (best-effort).
 * Never throws, and never awaits to avoid impacting UX.
 */
export function sendLog(payload: unknown): void {
    if (!hasEndpoint()) return;

    try {
        // Prefer navigator.sendBeacon for non-blocking delivery
        if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
            const blob = new Blob([JSON.stringify(payload)], {
                type: "application/json",
            });
            const ok = navigator.sendBeacon(endpoint as string, blob);
            if (ok) return;
            // If sendBeacon fails, fall through to fetch fallback
        }
    } catch {
        // swallow errors and try fetch fallback
    }

    try {
        // Fire-and-forget, keepalive attempts delivery during page unloads
        void fetch(endpoint as string, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
            keepalive: true,
            mode: "cors",
            credentials: "omit",
        }).catch(() => {
            // ignore network errors
        });
    } catch {
        // ignore errors
    }
}
