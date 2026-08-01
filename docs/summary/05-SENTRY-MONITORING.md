# Sentry Error Monitoring

## Backend (`backend/src/app/lib/sentry.ts`)
```ts
Sentry.init({
  dsn,
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 0.1,
  integrations: [Sentry.expressIntegration()],
});
```
- Initialization is a no-op if `SENTRY_DSN` is not set (safe for local dev without a DSN).
- `captureException(error)` helper wraps `Sentry.captureException`, guarded by the same DSN check, used across services/workers/middleware for uncaught exceptions.
- `expressIntegration()` auto-instruments Express request/response cycles for performance tracing.
- `tracesSampleRate: 0.1` samples 10% of transactions for performance monitoring to limit volume/cost.

## Frontend (`frontend/src/hooks/useSentryInit.ts` + `sentry.config.ts`)
- `useSentryInit.ts` calls `Sentry.init({...})` on the client, wiring the browser SDK (session replay/tracing options configured per the hook).
- `sentry.config.ts` at the project root integrates Sentry into the Next.js build (source maps, server-side instrumentation for API routes/server actions).
- `useWebVitals.ts` complements Sentry by capturing Core Web Vitals, which can be forwarded to Sentry or another analytics sink for performance insight.

## Error Flow
1. **Backend:** Any unhandled error reaches `globalErrorHandler`, which can call `captureException` before formatting the client-facing JSON error response.
2. **Frontend:** React error boundaries (`components/shared/error-boundary.tsx`, `app/error.tsx`, `app/global-error.tsx`) catch rendering errors and report them to Sentry via the initialized client SDK.

## Configuration
- DSN and environment are supplied via environment variables (`SENTRY_DSN` on backend; `NEXT_PUBLIC_SENTRY_DSN`-style var on frontend) — kept out of source control and centralized through `config/env.ts` (backend) / Next.js env handling (frontend).
- Sampling rate and integrations can be tuned per environment (e.g., lower in production to control quota, higher in staging for debugging).

## Why Sentry (vs. Winston alone)
Winston covers structured operational logs and audit trails written to files/console. Sentry adds:
- Automatic exception grouping/deduplication
- Stack trace symbolication (with source maps on the frontend)
- Alerting/notifications on new or spiking error types
- Performance tracing (slow endpoints/transactions) via `tracesSampleRate`
