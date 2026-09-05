---
paths:
  - "frontend/app/utils/logger.ts"
  - "frontend/app/utils/logTransport.ts"
  - "frontend/app/redux/middleware/**"
---

# Frontend logging internals (Pino, client-only)

The usage rules (use `app/utils/logger.ts`, `child()` for scope, never `console.*`, never log tokens, cookies or personal data) live in `AGENTS.md`. This file covers how the logger itself works, for anyone changing it.

## Files

- Core logger: `frontend/app/utils/logger.ts`
- Transport to Django: `frontend/app/utils/logTransport.ts`
- Redux action logging middleware (development only): `frontend/app/redux/middleware/loggerMiddleware.ts`, registered in `frontend/app/redux/store.ts` for non-production builds
- Reference usage: the RTK Query reauth flow in `frontend/app/redux/services/apiSlice.ts`

## Environment variables

- `NEXT_PUBLIC_LOG_LEVEL`: `trace | debug | info | warn | error | fatal`, default `info`.
- `NEXT_PUBLIC_LOG_ENDPOINT`: optional URL that receives JSON logs by POST or `sendBeacon`. Unset means console only.

## Behavior

- Pino outputs structured JSON with app metadata and a timestamp on every record.
- Every record is written to the browser console in every environment.
- When the endpoint is set, the transport uses `navigator.sendBeacon` and falls back to `fetch` with `keepalive`. Transport failures are swallowed and must never affect the UI.
- There is no server-side rendering and no Next.js API route involved; shipping goes straight from the browser to Django.

## API

- `import logger, { child, setContext, getContext } from "@/utils/logger"`
- `logger.debug | info | warn | error(fieldsOrMessage, message?)`
- `child({ component: "Name" })` returns a scoped logger.
- `setContext({ userId, sessionId, requestId })` merges into every later record; `getContext()` reads the snapshot.

## Level guidance

- debug: verbose diagnostics, development only
- info: lifecycle events and successful operations
- warn: recoverable anomalies and validation issues
- error: failures and caught exceptions, with `error.message` and the relevant IDs, not a stack trace

## Payload hygiene

- Keep fields small and explicit; never log full API responses or large arrays.
- The Redux middleware logs action types at debug and RTK Query rejections at warn with redacted, truncated payloads. It is not registered in production.

## Django side

- A POST endpoint accepting `application/json` log payloads; validate and redact again server-side.

## Testing

- Leave `NEXT_PUBLIC_LOG_ENDPOINT` unset so logs stay in the console.
- Spy on `logger.info` and friends to assert on log lines without printing.
