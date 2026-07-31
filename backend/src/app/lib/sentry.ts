import * as Sentry from "@sentry/node";

export const initSentry = () => {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
    integrations: [Sentry.expressIntegration()],
  });
};

export const captureException = (error: unknown) => {
  if (!process.env.SENTRY_DSN) return;
  Sentry.captureException(error);
};

export default Sentry;
