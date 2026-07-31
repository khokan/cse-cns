# 🏗️ Architecture & Integration Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           Root Layout (layout.tsx)                    │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │  Sentry Error Boundary (withServerComponent)   │ │  │
│  │  │  ┌──────────────────────────────────────────┐  │ │  │
│  │  │  │  Theme Provider                         │  │ │  │
│  │  │  │  ┌──────────────────────────────────┐   │  │ │  │
│  │  │  │  │  Query Providers (React Query)  │   │  │ │  │
│  │  │  │  │  ┌──────────────────────────┐   │   │  │ │  │
│  │  │  │  │  │  Pages / Components      │   │   │  │ │  │
│  │  │  │  │  │                          │   │   │  │ │  │
│  │  │  │  │  └──────────────────────────┘   │   │  │ │  │
│  │  │  │  └──────────────────────────────────┘   │  │ │  │
│  │  │  └──────────────────────────────────────────┘  │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Usage Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Page/Component                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  ErrorBoundary                                      │    │
│  │  (Catches React errors)                            │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Component Code                             │  │    │
│  │  │  ┌────────────────────────────────────────┐ │  │    │
│  │  │  │  useQuery({ ... })                    │ │  │    │
│  │  │  │  ┌──────────────────────────────────┐ │ │  │    │
│  │  │  │  │  DataLoader                      │ │ │  │    │
│  │  │  │  │  ├─ Loading → Skeleton           │ │ │  │    │
│  │  │  │  │  ├─ Error → Error + Retry        │ │ │  │    │
│  │  │  │  │  ├─ Empty → EmptyState           │ │ │  │    │
│  │  │  │  │  └─ Data → YourContent           │ │ │  │    │
│  │  │  │  └──────────────────────────────────┘ │ │  │    │
│  │  │  └────────────────────────────────────────┘ │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
                    ERROR OCCURS
                         │
                    ┌────┴────┐
                    │          │
                    ▼          ▼
              Component    API Call
                Error        Error
                │            │
                │    ┌───────┴────────┐
                │    │                │
                ▼    ▼                ▼
          Error          4xx          5xx
         Boundary      Warning       Exception
            │            │             │
            │    ┌────────┴─────┐      │
            │    │              │      │
            ▼    ▼              ▼      ▼
       ErrorBound Component  Toast  Sentry
          ary Page          Notify Capture
            │               Error   │
            │               │       │
            └───────────────┼───────┘
                           │
                    Sentry Dashboard
                    ├─ Error tracking
                    ├─ Stack traces
                    ├─ User context
                    ├─ Breadcrumbs
                    └─ Session replay
```

---

## Data Loading States

```
Component with async data
         │
    ┌────┼────────────────────┐
    │                         │
    ▼                         ▼
useQuery/fetch        (loading: true)
    │                         │
    │                   ┌─────┘
    │                   │
    │                   ▼
    │              DataLoader
    │              (Show Skeleton)
    │              ├─ 5 skeleton rows
    │              ├─ Height: h-12
    │              └─ Animated loading
    │                   │
    ├──────────────────┘
    │
    ├─ (isLoading: false)
    │  ├─ (isEmpty: true)
    │  │   └─ EmptyState
    │  │       ├─ Icon
    │  │       ├─ Title/Description
    │  │       ├─ Primary Action
    │  │       └─ Secondary Action
    │  │
    │  ├─ (error: true)
    │  │   └─ DataLoader Error
    │  │       ├─ Error message
    │  │       ├─ Retry button
    │  │       └─ Log to Sentry
    │  │
    │  └─ (data: available)
    │      └─ Show Component
    │          ├─ Table
    │          ├─ List
    │          └─ Cards
    │
    └─────────────────────────
          (Auto-refresh
            on error)
```

---

## Form Validation Flow

```
User Input
    │
    ▼
onChange Event
    │
    ▼
Validate with Rules
(required, minLength, etc)
    │
    ├─ Valid ─────────────┐
    │                     │
    ▼                     ▼
FormField            FormError
  ├─ Label         ├─ Message
  ├─ Input         ├─ Icon
  ├─ Helper Text   └─ Red styling
  └─ Clean UI      
                    │
                    ▼
                No Error Shown
```

---

## Confirmation Dialog Flow

```
User Action
(Click Delete)
    │
    ▼
ConfirmDialog Opens
├─ Icon (warning/info)
├─ Title
├─ Description
├─ Cancel Button
└─ Confirm Button
    │
    ├─ User Clicks Cancel
    │   └─ Dialog closes
    │
    └─ User Clicks Confirm
        │
        ▼
    setLoading(true)
        │
        ▼
    Call Mutation
        │
        ├─ Success
        │   ├─ Show Toast
        │   ├─ Close Dialog
        │   └─ Refresh Data
        │
        └─ Error
            ├─ Show Error Toast
            ├─ Log to Sentry
            └─ Keep Dialog Open
```

---

## Error Boundary Strategy

```
App Root
└─ ErrorBoundary (Global)
   ├─ Navbar
   ├─ Layout Routes
   │  └─ ErrorBoundary (Route)
   │     ├─ Page Header
   │     ├─ ErrorBoundary (Feature)
   │     │  ├─ Component 1
   │     │  ├─ Component 2
   │     │  └─ Component 3
   │     └─ Page Footer
   └─ Global Error Handler (global-error.tsx)

Benefits:
✅ Granular error handling
✅ Isolated error display
✅ Better user experience
✅ Precise error logging
✅ Component continues working if one fails
```

---

## Sentry Integration Points

```
┌────────────────────────────────────────┐
│       Sentry DSN Configuration         │
│  process.env.NEXT_PUBLIC_SENTRY_DSN   │
└────────────────────────────────────────┘
           │
    ┌──────┼──────┬──────────┬──────────┐
    │      │      │          │          │
    ▼      ▼      ▼          ▼          ▼
Component Route  API      Debug      User
Error     Error  Error    Page      Context
Handler   Page   Tracking Testing   Tracking
  │       │      │        │         │
  ├──────┴──────┴────────┴────────┬─┘
  │                               │
  ▼                               ▼
Sentry.captureException()    Sentry.setUser()
                                   │
                           ┌───────┘
                           │
  ┌─────────────────────────────────────┐
  │      Sentry Cloud Dashboard         │
  ├─────────────────────────────────────┤
  │                                     │
  │  Issues                             │
  │  ├─ Error tracking                  │
  │  ├─ Stack traces                    │
  │  ├─ Frequency analysis              │
  │  └─ Trends                          │
  │                                     │
  │  Releases                           │
  │  ├─ Version tracking                │
  │  └─ Deployment monitoring           │
  │                                     │
  │  Performance                        │
  │  ├─ API latency                     │
  │  ├─ Database queries                │
  │  └─ Core Web Vitals                 │
  │                                     │
  │  Replays                            │
  │  ├─ Session recording               │
  │  ├─ User journey                    │
  │  └─ Error context                   │
  │                                     │
  │  Alerts                             │
  │  ├─ Critical errors                 │
  │  ├─ Error spikes                    │
  │  └─ Performance degradation         │
  │                                     │
  └─────────────────────────────────────┘
```

---

## Component Interaction Matrix

```
Component           Used In         Benefits
────────────────────────────────────────────────────────────
ErrorBoundary       Route pages     Catches component errors
FormField          All forms        Consistent validation UI
FormError          Form fields      Error message display
EmptyState         Data lists       User-friendly empty state
DataLoader         Async views      Unified loading/error/empty
ConfirmDialog      Delete actions   Prevents accidents
Debug Page         Development      Test error tracking
────────────────────────────────────────────────────────────
API Client         All requests     Auto error tracking to Sentry
useSentryInit      Root layout      Client-side Sentry init
error.tsx          Route level      Route segment errors
global-error.tsx   App level        Critical errors
not-found.tsx      Invalid routes   404 handling
```

---

## Weekly Implementation Timeline

```
WEEK 1: Error Handling (DONE ✅)
├─ Day 1: Sentry setup
│  ├─ Create account
│  ├─ Copy DSN
│  └─ Configure env
├─ Day 2: Configuration
│  ├─ sentry.config.ts
│  ├─ next.config.ts
│  └─ Error pages
├─ Day 3-4: Integration
│  ├─ API error tracking
│  ├─ Error boundary
│  └─ Sentry init hook
└─ Day 5: Testing
   ├─ Debug page
   ├─ Error scenarios
   └─ Sentry events

WEEK 2-3: UI Components (DONE ✅)
├─ Form Validation
│  ├─ FormError
│  ├─ FormField
│  └─ Integration examples
├─ Data States
│  ├─ EmptyState
│  ├─ DataLoader
│  └─ Loading skeletons
└─ User Actions
   ├─ ConfirmDialog
   └─ Integration examples

WEEK 4: Polish (READY ✅)
├─ Performance
├─ Dark Mode
└─ Mobile Optimization
```

---

## File Dependency Graph

```
next.config.ts
    ├─ withSentryConfig
    └─ sentry.config.ts

layout.tsx
    ├─ Sentry.withServerComponentErrorBoundary
    ├─ useSentryInit.ts
    ├─ Navbar
    ├─ Footer
    ├─ QueryProviders
    └─ ThemeProvider

Components
    ├─ error-boundary.tsx (uses Sentry)
    ├─ form-error.tsx
    ├─ empty-state.tsx
    ├─ data-loader.tsx (uses empty-state, Skeleton)
    └─ confirm-dialog.tsx (uses Dialog, Button)

Pages
    ├─ error.tsx (uses Sentry)
    ├─ global-error.tsx (uses Sentry)
    ├─ not-found.tsx
    └─ debug/page.tsx (uses Sentry)

API
    └─ api-client.ts (uses Sentry, toast)

Hooks
    └─ useSentryInit.ts (uses Sentry)

Environment
    └─ .env (NEXT_PUBLIC_SENTRY_DSN)
```

---

## State Management Flow

```
Page Component
    │
    ├─ useState (local UI state)
    │  ├─ Dialog open/close
    │  ├─ Form validation
    │  └─ Loading state
    │
    └─ useQuery (server state)
       ├─ Data fetching
       ├─ Loading state
       ├─ Error state
       └─ Automatic caching
           │
           ├─ Error captured in Sentry
           ├─ User shown error UI
           ├─ Retry option available
           └─ Error tracked with context
```

---

## Security & Privacy

```
Data Flow
┌─────────────────────────────┐
│    User Browser             │
│  (Frontend Application)     │
└─────────────────────────────┘
              │
              │ HTTPS Encrypted
              │ cookies, headers
              │
              ▼
        ┌─────────────┐
        │ Backend API │
        │  (Node.js)  │
        └─────────────┘
              │
              │ Secure Connection
              │
              ▼
        ┌─────────────┐
        │  Database   │
        │ (Prisma)    │
        └─────────────┘

Sentry Data Flow
┌─────────────────────────────┐
│    Error Captured           │
│  (Frontend/API)             │
└─────────────────────────────┘
              │
              │ HTTPS Encrypted
              │ Sensitive data redacted
              │
              ▼
        ┌──────────────┐
        │ Sentry Cloud │
        │  Dashboard   │
        └──────────────┘

Features:
✅ Source maps uploaded (if using tunneling)
✅ PII redacted from events
✅ Session replays optional
✅ Replay data encrypted
✅ Compliance with privacy regulations
```

---

## Deployment Checklist Architecture

```
Development
├─ Sentry: 100% sample rate
├─ Console: Verbose logging
├─ Replays: 100% capture
└─ Performance: Full tracking

Staging
├─ Sentry: 50% sample rate
├─ Console: Normal logging
├─ Replays: Error replay only
└─ Performance: Custom metrics

Production
├─ Sentry: 10% sample rate
├─ Console: Errors only
├─ Replays: 10% capture (error 100%)
├─ Performance: Custom metrics
├─ Alerts: Critical errors only
└─ Rate limiting: Enabled
```

---

**Architecture Overview Complete** ✅  
All components properly integrated and documented.
