"use client";

import type { Middleware } from "@reduxjs/toolkit";
import logger from "@/utils/logger";

/**
 * Redux middleware for dev-time action logging.
 *
 * Why:
 * - Provide low-noise visibility into Redux actions during development only.
 * - Surface important events (e.g., RTK Query rejections) without leaking PII.
 *
 * Behavior:
 * - In production, this middleware is effectively disabled (not included in the chain).
 * - In development:
 *   - Logs action types at debug level.
 *   - Logs RTK Query errors (actions ending with `/rejected`) at warn level
 *     with a small, redacted snapshot of payload/meta for troubleshooting.
 */
const DEV_MODE = process.env.NODE_ENV !== "production";

/**
 * Serialize small, safe snapshots of objects for logging without PII.
 * Truncates large strings and limits object depth.
 */
function safeSample(value: unknown, depth = 0, maxDepth = 2): unknown {
    if (value == null) return value;
    if (depth > maxDepth) return "[depth]";
    const t = typeof value;
    if (t === "string") {
        const s = value as string;
        return s.length > 200 ? `${s.slice(0, 200)}…(${s.length - 200} more)` : s;
    }
    if (t === "number" || t === "boolean") return value;
    if (Array.isArray(value)) {
        return value.slice(0, 5).map((v) => safeSample(v, depth + 1, maxDepth));
    }
    if (t === "object") {
        const obj = value as Record<string, unknown>;
        const out: Record<string, unknown> = {};
        let count = 0;
        for (const k of Object.keys(obj)) {
            if (count >= 5) {
                out["…"] = "truncated";
                break;
            }
            out[k] = safeSample(obj[k], depth + 1, maxDepth);
            count += 1;
        }
        return out;
    }
    return String(value);
}

/**
 * Dev-only logger middleware.
 */
const loggerMiddleware: Middleware = () => (next) => (action) => {
    if (!DEV_MODE) {
        return next(action);
    }

    const type = (action as any)?.type as string | undefined;
    const payload = (action as any)?.payload;
    const meta = (action as any)?.meta;

    if (type) {
        if (type.endsWith("/rejected")) {
            const errorDetail =
                payload && typeof payload === "object"
                    ? (payload as { data?: { detail?: unknown } })?.data?.detail
                    : undefined;
            const responseUrl =
                meta && typeof meta === "object"
                    ? (meta as { baseQueryMeta?: { response?: { url?: string } } })?.baseQueryMeta
                          ?.response?.url
                    : undefined;
            logger.warn(
                {
                    type,
                    payload: safeSample(payload, 0, 3),
                    meta: safeSample(meta, 0, 3),
                    errorDetail: safeSample(errorDetail, 0, 1),
                    responseUrl,
                },
                "RTK Query action rejected",
            );
        } else {
            logger.debug({ type }, "Redux action dispatched");
        }
    }

    return next(action);
};

export default loggerMiddleware;
