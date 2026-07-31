const sentryConfig = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Capture 10% of all transactions in production, 100% in dev
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Capture 100% of errors
  replaysOnErrorSampleRate: 1.0,
  
  // Capture 10% of sessions in production
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION,
};

export default sentryConfig;