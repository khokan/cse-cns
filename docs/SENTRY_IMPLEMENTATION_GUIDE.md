# Sentry Implementation Guide

**Quick Reference for Setting Up Error Tracking in Frontend**

---

## 1. INSTALLATION (5 minutes)

### Step 1: Install Packages
```bash
cd frontend
pnpm install @sentry/nextjs @sentry/react @sentry/tracing
```

### Step 2: Create Configuration File
Create `sentry.config.ts`:

```typescript
import * as Sentry from "@sentry/nextjs";

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
  
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
};

export default sentryConfig;
```

### Step 3: Add Environment Variables
Create/Update `.env.local`:

```bash
# Get your DSN from https://sentry.io/settings/your-org/projects/
NEXT_PUBLIC_SENTRY_DSN=https://your-key@your-sentry-domain.ingest.sentry.io/your-project-id

# Optional: For release tracking
NEXT_PUBLIC_APP_VERSION=1.0.0

# Sentry auth token (for build time)
SENTRY_AUTH_TOKEN=your_auth_token_here
```

---

## 2. NEXT.JS INTEGRATION (10 minutes)

### Step 1: Update next.config.ts

```typescript
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // ... your existing config
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "your-org",
  project: process.env.SENTRY_PROJECT || "your-project",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Automatically annotate errors with source maps
  // Set to false to disable during development
  silent: false,
  
  // Tunneling (optional, for privacy)
  // tunnelRoute: "/monitoring",
});
```

### Step 2: Create Root Error Handler
Create `src/app/error.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error, {
      tags: {
        component: "root-error-handler",
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">Oops!</h1>
        </div>

        <p className="text-gray-600 mb-4">
          Something went wrong. We've been notified and will look into it.
        </p>

        <p className="text-sm text-gray-500 mb-6 bg-gray-50 p-3 rounded font-mono break-all">
          Error ID: {error.digest || "unknown"}
        </p>

        <div className="flex gap-3">
          <Button variant="outline" onClick={reset} className="flex-1">
            Try Again
          </Button>
          <Button
            variant="default"
            onClick={() => (window.location.href = "/")}
            className="flex-1"
          >
            Go Home
          </Button>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Our team is investigating. Please refresh or come back shortly.
        </p>
      </div>
    </div>
  );
}
```

### Step 3: Create Global Error Handler
Create `src/app/global-error.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { component: "global-error-handler" },
    });
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
          <div className="max-w-md text-center">
            <h1 className="text-3xl font-bold mb-4">Critical Error</h1>
            <p className="text-gray-300 mb-8">
              A critical error has occurred. Please refresh your browser.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
```

### Step 4: Create Not Found Handler
Create `src/app/not-found.tsx`:

```typescript
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full text-center">
        <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button className="w-full">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
```

---

## 3. INITIALIZATION (5 minutes)

### Step 1: Update Root Layout
Update `src/app/layout.tsx`:

```typescript
import "./globals.css";
import type { Metadata } from "next";
import { Footer } from "@/components/shared/footer";
import { Toaster } from "sonner";
import Navbar from "@/components/shared/navbar";
import { ThemeProvider } from "@/components/providers/theme-provider";
import QueryProviders from "@/components/providers/Queryprovider";

// Initialize Sentry for server-side
import * as Sentry from "@sentry/nextjs";

// This wrapper ensures errors are captured
const SentryQueryProviders = Sentry.withServerComponentErrorBoundary(
  QueryProviders,
  {
    fallback: <div>An error occurred</div>,
    showDialog: false,
  }
);

export const metadata: Metadata = {
  title: "CSE WEB",
  description: "Exchange Clearing & Settlement System",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <SentryQueryProviders>
            <Navbar />
            <main className="min-h-[calc(100vh-170px)]">{children}</main>
            <Footer />
            <Toaster richColors position="top-right" />
          </SentryQueryProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Step 2: Create Client Initialization Hook
Create `src/hooks/useSentryInit.ts`:

```typescript
"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useSession } from "@/hooks/useSession";

export function useSentryInit() {
  const { user } = useSession();

  useEffect(() => {
    // Initialize Sentry client-side
    if (typeof window !== "undefined") {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate:
          process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        replaysSessionSampleRate:
          process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        replaysOnErrorSampleRate: 1.0,
      });
    }
  }, []);

  // Set user context when user is available
  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.name,
      });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);
}
```

### Step 3: Use Initialization Hook
In your main layout or app component:

```typescript
"use client";

import { useSentryInit } from "@/hooks/useSentryInit";

export function AppWrapper({ children }: { children: React.ReactNode }) {
  useSentryInit();
  return children;
}
```

---

## 4. API ERROR TRACKING (10 minutes)

### Update API Client with Sentry
Update `src/lib/api-client.ts`:

```typescript
import axios, { AxiosError, AxiosResponse } from "axios";
import * as Sentry from "@sentry/nextjs";
import { toast } from "sonner";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    Sentry.captureException(error, {
      tags: { interceptor: "request" },
    });
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Don't capture 4xx errors as exceptions, but track them
    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
      Sentry.captureMessage(`API Client Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, "warning", {
        tags: {
          status: error.response.status,
          method: error.config?.method,
          url: error.config?.url,
        },
      });
    } else {
      // Capture 5xx and network errors
      Sentry.captureException(error, {
        tags: {
          status: error.response?.status,
          method: error.config?.method,
          url: error.config?.url,
        },
      });
    }

    // Show toast notification
    if (error.response?.status === 401) {
      toast.error("Session expired. Please login again.");
      window.location.href = "/login";
    } else if (error.response?.status === 403) {
      toast.error("You don't have permission for this action.");
    } else if (error.response?.status === 404) {
      toast.error("Resource not found.");
    } else if (error.response?.status >= 500) {
      toast.error("Server error. Please try again later.");
    } else if (!error.response) {
      toast.error("Network error. Please check your connection.");
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 5. MANUAL ERROR CAPTURING (5 minutes)

### Capture Exceptions
```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // Your code
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: "checkout",
      action: "payment_processing",
    },
    level: "error",
  });
}
```

### Capture Messages
```typescript
import * as Sentry from "@sentry/nextjs";

// Track important events
Sentry.captureMessage("User initiated export", "info", {
  tags: {
    feature: "reports",
    action: "export",
  },
});
```

### Add Breadcrumbs
```typescript
import * as Sentry from "@sentry/nextjs";

// Track user actions
Sentry.addBreadcrumb({
  category: "navigation",
  message: "User navigated to reports page",
  level: "info",
  timestamp: Date.now() / 1000,
});
```

### Set Context
```typescript
import * as Sentry from "@sentry/nextjs";

// Add contextual information
Sentry.setContext("report", {
  reportId: "12345",
  type: "settlement",
  format: "excel",
});
```

---

## 6. COMPONENT ERROR BOUNDARIES (10 minutes)

### Create Reusable Error Boundary
Create `src/components/shared/error-boundary.tsx`:

```typescript
"use client";

import { ReactNode, useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        component: this.props.componentName || "unknown",
        boundary: "component",
      },
    });

    // Call optional error handler
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-900">Component Error</h3>
            </div>
            <p className="text-red-800 text-sm mb-4">
              An error occurred while rendering this component.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => this.setState({ hasError: false })}
            >
              Retry
            </Button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

### Use Error Boundary in Components
```typescript
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { ReportsList } from "@/components/modules/reports/reports-list";

export function Page() {
  return (
    <ErrorBoundary componentName="reports-page">
      <ReportsList />
    </ErrorBoundary>
  );
}
```

---

## 7. TESTING SENTRY (10 minutes)

### Test Error Capturing
Add a debug page at `src/app/debug/page.tsx`:

```typescript
"use client";

import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DebugPage() {
  const testScenarios = [
    {
      name: "Capture Exception",
      fn: () => {
        throw new Error("Test error from debug page");
      },
    },
    {
      name: "Capture Message",
      fn: () => {
        Sentry.captureMessage("Test message", "info");
      },
    },
    {
      name: "Add Breadcrumb",
      fn: () => {
        Sentry.addBreadcrumb({
          message: "Test breadcrumb",
          level: "info",
        });
        alert("Breadcrumb added. Check Sentry.");
      },
    },
    {
      name: "Set User Context",
      fn: () => {
        Sentry.setUser({
          id: "test-user",
          email: "test@example.com",
        });
        alert("User context set. Check Sentry.");
      },
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Sentry Debug Panel</h1>
      <Card className="p-6">
        <div className="space-y-4">
          {testScenarios.map((scenario) => (
            <Button
              key={scenario.name}
              onClick={() => {
                try {
                  scenario.fn();
                } catch (error) {
                  Sentry.captureException(error);
                }
              }}
              className="w-full"
            >
              {scenario.name}
            </Button>
          ))}
        </div>
      </Card>
      <p className="text-sm text-gray-600 mt-6">
        Go to Sentry dashboard to see the events being captured.
      </p>
    </div>
  );
}
```

Navigate to `/debug` to test error capturing.

---

## 8. MONITORING CHECKLIST

### Before Going to Production

- [ ] Sentry account created and project set up
- [ ] DSN copied to `.env.local`
- [ ] `next.config.ts` updated with Sentry plugin
- [ ] Error pages created (`error.tsx`, `global-error.tsx`, `not-found.tsx`)
- [ ] API client updated with error interceptors
- [ ] Sentry init hook created
- [ ] User context tracking added
- [ ] Test error page works
- [ ] Debug page tested
- [ ] Source maps uploaded (if using tunneling)
- [ ] Sentry alerts configured

### After Deployment

- [ ] Monitor Sentry dashboard for first 24 hours
- [ ] Check error rate and patterns
- [ ] Review user session replays for errors
- [ ] Verify breadcrumb tracking working
- [ ] Confirm performance monitoring active
- [ ] Test release tracking

---

## 9. COMMON ISSUES & SOLUTIONS

### DSN Not Set
**Problem:** Events not showing in Sentry  
**Solution:**
```bash
# Check env variable is set
echo $NEXT_PUBLIC_SENTRY_DSN

# Ensure it's in .env.local, not .env
cat .env.local | grep SENTRY_DSN
```

### Source Maps Not Generated
**Problem:** Can't see line numbers in errors  
**Solution:**
```typescript
// In next.config.ts
export default withSentryConfig(nextConfig, {
  sourceMapsDist: ".next",
  releaseName: "1.0.0",
});
```

### Too Many Events
**Problem:** Sentry quota exceeded  
**Solution:**
```typescript
// Reduce sample rate
tracesSampleRate: 0.05, // Capture 5% instead of 100%
replaysSessionSampleRate: 0.05, // Capture 5% of sessions
```

### Events Not Captured
**Problem:** Error boundaries not working  
**Solution:**
```typescript
// Ensure error.tsx is in the right location
src/app/error.tsx       // Route segment error
src/app/global-error.tsx // Global error handler
src/app/not-found.tsx    // 404 errors
```

---

## 10. NEXT STEPS

1. **Get Sentry Account:** https://sentry.io/signup/
2. **Create Project:** Select "Next.js" platform
3. **Copy DSN:** From project settings
4. **Add to .env.local:** `NEXT_PUBLIC_SENTRY_DSN=...`
5. **Run Steps 1-4:** Follow the installation section above
6. **Test:** Navigate to `/debug` page
7. **Monitor:** Check Sentry dashboard

**Estimated Time:** 30 minutes for full setup

---

## Support Resources

- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Next.js Integration:** https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/
- **Best Practices:** https://docs.sentry.io/platforms/javascript/best-practices/
- **API Reference:** https://docs.sentry.io/platforms/javascript/enriching-events/
