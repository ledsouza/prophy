Prophy Frontend Logging Rules (Next.js, client-only)

Summary

-   The frontend implements a client-only structured logging solution using Pino&#xA0;(browser build). The app does not use server-side rendering nor Next.js API routes for logging.&#xA0;Logs are always written to the browser console for visibility. Optionally, logs can be shipped directly to the Django backend when an endpoint is configured.
-   Redux action logging is enabled in development via a dedicated middleware with low noise and redaction/sampling.

Where to find it

-   Core logger (client-only): frontend/app/utils/logger.ts
-   Transport (client-to-Django): frontend/app/utils/logTransport.ts
-   Redux middleware (development only): frontend/app/redux/middleware/loggerMiddleware.ts
-   Store integration (development only): frontend/app/redux/store.ts
-   Usage examples:
    -   Visit submit flow: frontend/app/components/forms/VisitScheduleForm.tsx
    -   RTK baseQuery reauth/error flow: frontend/app/redux/services/apiSlice.ts

Environment variables (client-safe)

-   NEXT_PUBLIC_LOG_LEVEL: one of trace | debug | info | warn | error | fatal. Default: info
-   NEXT_PUBLIC_LOG_ENDPOINT: optional URL that receives JSON logs via POST/sendBeacon. If unset, logs remain console-only

Design and behavior

-   Structured logs: Pino outputs JSON objects with consistent fields. Every log includes app metadata and a timestamp.
-   Console output: All logs are written to the browser console. This is the default behavior in every environment to ensure local visibility during development and troubleshooting.
-   Optional remote shipping: If NEXT_PUBLIC_LOG_ENDPOINT is defined, the client attempts to ship logs to the Django endpoint using navigator.sendBeacon (best effort) and falls back to fetch with keepalive. Transport failures are swallowed and must not impact UX.
-   No SSR and no Next.js API routes are used. The logger is client-only and talks directly to Django when configured.

Logger API

-   Import:
    -   import logger, { child, setContext, getContext } from "@/utils/logger";
-   Methods:
    -   logger.debug(msgOrFields?, msg?)
    -   logger.info(msgOrFields?, msg?)
    -   logger.warn(msgOrFields?, msg?)
    -   logger.error(msgOrFields?, msg?)
-   Scoped context:
    -   const log = child({ component: "MyComponent" })
    -   log.info({ id }, "Loaded")
-   Global context:
    -   setContext({ userId, sessionId, requestId })
    -   getContext() returns a snapshot of the current shared context

Level guidance

-   debug: verbose diagnostics; use sparingly; development-oriented
-   info: significant lifecycle events and successful operations
-   warn: recoverable anomalies or validation issues
-   error: failures and caught exceptions; include a message and relevant IDs

PII and security

-   Never log secrets, tokens, cookies, raw JWTs, or personal data.
-   Prefer IDs and coarse context over entire payloads.
-   For errors, include error.message instead of full stacktraces unless a stack is absolutely necessary and safe.

Payload hygiene and sampling

-   Keep structured metadata small and explicit.
-   Avoid logging full API responses or large arrays/objects.
-   The Redux dev middleware samples/truncates payload/meta automatically to reduce noise.

Redux middleware (development only)

-   File: frontend/app/redux/middleware/loggerMiddleware.ts
-   Behavior:
    -   Logs action types at debug level
    -   Logs RTK Query rejections at warn with redacted snapshots
-   Integration:
    -   frontend/app/redux/store.ts adds the middleware only in non-production builds
-   No logging of payloads in production via the middleware to avoid PII leakage and noise

Console usage policy

-   Do not use console.\* directly in application code.
-   console.\* is allowed only inside the logger internals to implement the console destination. ESLint no-console remains enforced elsewhere.

Transport behavior and Django expectations

-   Client shipping:
    -   Uses sendBeacon where available; falls back to fetch with keepalive
    -   Fire-and-forget; must not block navigation or degrade UX
-   Django endpoint (server side, not in this repo section):
    -   Provide a POST endpoint that accepts application/json log payloads
    -   Optionally validate, normalize, and ingest to your logging sink
    -   Consider additional server-side redaction for defense in depth

Testing guidance

-   Leave NEXT_PUBLIC_LOG_ENDPOINT unset so logs remain local to the console.
-   Spy on logger methods (e.g., logger.info) in unit tests to assert important log lines without printing.

Performance considerations

-   Avoid logging in tight render loops or hot code paths.
-   Prefer info/warn/error for meaningful events; use debug temporarily and clean up afterwards.
-   Keep metadata small; ship only what is necessary.

Conventional Commits

-   feat(logging): add structured logs to XYZ
-   chore(redux): integrate dev logger middleware into store
-   feat(api): add structured logging to baseQuery reauth flow

Quick examples

-   Component-level logging

    -   import { child } from "@/utils/logger"
    -   const log = child({ component: "VisitScheduleForm" })
    -   log.info({ mode: "create", unitId }, "Submitting visit schedule")
    -   log.error({ error: err?.message, unitId }, "Visit schedule submit failed")

-   API layer logging

    -   import { child } from "@/utils/logger"
    -   const log = child({ feature: "apiSlice" })
    -   log.warn({ endpoint }, "API request unauthorized (401)")
    -   log.error({ status }, "API request failed")

-   Global context enrichment
    -   setContext({ userId, sessionId, requestId })
    -   This context is merged into all subsequent logs (avoid sensitive data)

Notes

-   The previous approach that relied on Next.js server routes for logging is not applicable in this project, since there is no SSR or Next.js backend. All remote shipping is done directly from the client to Django when configured.
