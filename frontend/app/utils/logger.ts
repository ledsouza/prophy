"use client";

import pino, { type Logger, type LoggerOptions } from "pino";
import { hasEndpoint, sendLog } from "@/utils/logTransport";
import { version as appVersion } from "../../package.json";

/**
 * Centralized client-side logger for the Next.js frontend.
 *
 * Behavior:
 * - Uses console.* in all environments to preserve local visibility.
 * - If NEXT_PUBLIC_LOG_ENDPOINT is defined, also ships logs to that endpoint
 *   using navigator.sendBeacon (best-effort) or fetch keepalive.
 *
 * Environment variables (client-safe):
 * - NEXT_PUBLIC_LOG_LEVEL: "trace" | "debug" | "info" | "warn" | "error" | "fatal" (default: "info")
 * - NEXT_PUBLIC_LOG_ENDPOINT: optional URL to a Django endpoint that accepts log JSON
 */
type LogContext = Record<string, unknown>;

const APP_NAME = "prophy-frontend";
const level = (process.env.NEXT_PUBLIC_LOG_LEVEL || "info").toLowerCase() as LoggerOptions["level"];

let sharedContext: LogContext = {};

/**
 * Merge additional properties that should be included on every log line,
 * such as sessionId, userId, requestId, etc.
 */
export function setContext(partial: LogContext): void {
    sharedContext = { ...sharedContext, ...partial };
}

export function getContext(): LogContext {
    return { ...sharedContext };
}

function levelNameFromNumber(num: number): "trace" | "debug" | "info" | "warn" | "error" | "fatal" {
    switch (num) {
        case 10:
            return "trace";
        case 20:
            return "debug";
        case 30:
            return "info";
        case 40:
            return "warn";
        case 50:
            return "error";
        case 60:
            return "fatal";
        default:
            return "info";
    }
}

function writeToConsole(entry: Record<string, unknown> & { level: number; msg?: string }) {
    const lvl = levelNameFromNumber(entry.level);
    const { msg, ...rest } = entry;
    // Keep console output readable while preserving structured metadata.
    // Message string first, then structured data.
    if (lvl === "trace" || lvl === "debug") {
        if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.debug(msg ?? "", rest);
        }
        return;
    }

    switch (lvl) {
        case "info":
            // eslint-disable-next-line no-console
            console.info(msg ?? "", rest);
            break;
        case "warn":
            // eslint-disable-next-line no-console
            console.warn(msg ?? "", rest);
            break;
        case "error":
        case "fatal":
            // eslint-disable-next-line no-console
            console.error(msg ?? "", rest);
            break;
        default:
            // eslint-disable-next-line no-console
            console.log(msg ?? "", rest);
            break;
    }
}

/**
 * Creates a pino logger configured for the browser with a custom writer
 * that prints to console and optionally ships to a remote endpoint.
 */
function createLogger(): Logger {
    const options: LoggerOptions = {
        level,
        browser: {
            asObject: true,
            // Note: Pino's type for write expects (o: object) => void; keep param wide to satisfy types.
            write: (o: object) => {
                const obj = o as Record<string, unknown> & { level?: number; msg?: string };
                const payloadLevel = typeof obj.level === "number" ? obj.level : 30; // default to info
                const base = {
                    app: APP_NAME,
                    version: appVersion,
                    ts: new Date().toISOString(),
                };
                const payload = { ...base, ...sharedContext, ...obj, level: payloadLevel };

                // Always write to the console for developer visibility
                writeToConsole(
                    payload as Record<string, unknown> & { level: number; msg?: string }
                );

                // Optionally ship logs to a server endpoint (best-effort)
                if (hasEndpoint()) {
                    try {
                        // fire-and-forget; do not await
                        sendLog(payload);
                    } catch {
                        // swallow transport errors to avoid impacting UX
                    }
                }
            },
        },
    };

    return pino(options);
}

const logger = createLogger();

/**
 * Create a child logger with scoped context that will be included in all its logs.
 * Useful to bind identifiers like component, feature, or correlation IDs locally.
 */
export function child(bindings: LogContext): Logger {
    return logger.child(bindings);
}

export default logger;
