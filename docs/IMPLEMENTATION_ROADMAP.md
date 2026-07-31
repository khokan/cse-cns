# Implementation Roadmap: Step-by-Step Action Plan

## Overview

This document provides concrete, actionable steps to fix guideline violations in priority order.

---

## 🚀 PHASE 1: LOGGING (Week 1 - Days 1-2)

### Objective
Replace all `console.log` with structured Winston logging, enabling production observability.

### Step 1: Install Dependencies

```bash
pnpm install winston winston-daily-rotate-file
pnpm install --save-dev @types/winston
```

### Step 2: Create Logger Utility

**File:** `backend/src/app/utils/logger.ts`

```typescript
import winston from 'winston';
import { envVars } from '../config/env.js';

const isDevelopment = envVars.NODE_ENV === 'development';

const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console for all environments
    new winston.transports.Console({
      format: isDevelopment
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, ...meta }) => {
              const metaStr = Object.keys(meta).length
                ? JSON.stringify(meta, null, 2)
                : '';
              return `${timestamp} [${level}] ${message} ${metaStr}`;
            })
          )
        : winston.format.json()
    }),
    // File for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    // File for all logs
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

export default logger;
```

### Step 3: Create Correlation ID Middleware

**File:** `backend/src/app/middleware/correlationId.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
  (req as any).correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
};
```

### Step 4: Update app.ts to Use Middleware

```typescript
// Add at top of middleware stack in backend/src/app.ts
app.use(correlationIdMiddleware);

// Remove this later:
// app.use(cors(...))
```

### Step 5: Replace console.log in Files

**Files to update:**

1. **backend/src/server.ts**
   ```typescript
   // OLD: console.log("✅ Both databases connected successfully");
   // NEW: logger.info("Databases connected", { db: 'cnsweb,cns' });
   ```

2. **backend/src/app/workers/report.worker.ts**
   ```typescript
   // OLD: console.log(`📋 [TaxCert] Calling Certificate_Show...`);
   // NEW: logger.debug("Fetching tax certificate", { memberId, dateRange });
   ```

3. **backend/src/app/workers/settlement.worker.ts**
   ```typescript
   // OLD: console.log(`⚖️ [SettlementWorker] Processing settlement...`);
   // NEW: logger.info("Processing settlement", { contractNumber });
   ```

4. **backend/src/app/utils/seed.ts**
   ```typescript
   // OLD: console.log("Admin already exists");
   // NEW: logger.info("Admin user already exists, skipping seed");
   ```

5. **backend/src/app/utils/email.ts**
   ```typescript
   // OLD: console.log("Email Sending", ...);
   // NEW: logger.info("Sending email", { to, subject });
   ```

### Step 6: Create Request Logging Middleware

**File:** `backend/src/app/middleware/requestLogger.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      correlationId: (req as any).correlationId
    });
  });
  
  next();
};
```

### Step 7: Add to app.ts

```typescript
// Add after correlationIdMiddleware
app.use(requestLogger);
```

### Validation

```bash
# Start server and check logs
npm run dev

# Verify logs appear in logs/combined.log
tail -f logs/combined.log
```

---

## 🧪 PHASE 1B: SETUP TESTING (Week 1 - Days 3-4)

### Objective
Create test framework and write tests for utility functions.

### Step 1: Install Jest

```bash
npm install --save-dev jest ts-jest @types/jest
npm install --save-dev @testing-library/jest-dom
```

### Step 2: Create jest.config.ts

```typescript
// backend/jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/generated/**'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  }
};

export default config;
```

### Step 3: Update package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Step 4: Create Test for AppError

**File:** `backend/src/app/errorHelpers/__tests__/AppError.test.ts`

```typescript
import AppError from '../AppError';
import status from 'http-status';

describe('AppError', () => {
  it('should create error with status code and message', () => {
    const error = new AppError(status.BAD_REQUEST, 'Test error');
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Test error');
  });

  it('should preserve stack trace', () => {
    const error = new AppError(status.INTERNAL_SERVER_ERROR, 'Server error');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('AppError');
  });

  it('should allow custom stack trace', () => {
    const customStack = 'Custom stack trace';
    const error = new AppError(status.NOT_FOUND, 'Not found', customStack);
    expect(error.stack).toBe(customStack);
  });
});
```

### Step 5: Run Tests

```bash
npm run test
npm run test:coverage
```

---

## 🏥 PHASE 2: HEALTH & READINESS (Week 1 - Day 5)

### Objective
Add health and readiness endpoints for production deployment checks.

### Step 1: Create Health Routes

**File:** `backend/src/app/routes/health.route.ts`

```typescript
import { Router, Request, Response } from 'express';
import { db } from '../lib/prisma.js';
import { redisClient } from '../lib/redis.js';
import logger from '../utils/logger.js';

const router = Router();

// Basic health check
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Detailed readiness check
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check database connections
    const cnswebOk = await db.cnsWeb.$queryRaw`SELECT 1`;
    const cnsOk = await db.cns.$queryRaw`SELECT 1`;
    
    // Check Redis
    let redisOk = false;
    try {
      await redisClient.ping();
      redisOk = true;
    } catch (err) {
      logger.error('Redis health check failed', { error: err });
    }

    const ready = cnswebOk && cnsOk && redisOk;

    res.status(ready ? 200 : 503).json({
      ready,
      checks: {
        database: {
          cnsweb: cnswebOk ? 'connected' : 'failed',
          cns: cnsOk ? 'connected' : 'failed'
        },
        cache: {
          redis: redisOk ? 'connected' : 'failed'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Readiness check error', { error });
    res.status(503).json({
      ready: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

export const HealthRoutes = router;
```

### Step 2: Add to Main Routes

**File:** `backend/src/app/routes/index.ts`

```typescript
import { HealthRoutes } from "./health.route.js";

const router = Router();

// Health checks should not require auth
router.use("/health", HealthRoutes);

// Other routes require auth
router.use("/auth", AuthRoutes);
// ... rest of routes
```

### Step 3: Test Endpoints

```bash
curl http://localhost:5000/api/v1/health
curl http://localhost:5000/api/v1/health/ready
```

---

## 🔒 PHASE 2B: SENTRY INTEGRATION (Week 2)

### Objective
Setup error tracking and performance monitoring with Sentry.

### Step 1: Install Sentry

```bash
npm install @sentry/node @sentry/tracing
```

### Step 2: Create Sentry Initialization

**File:** `backend/src/app/config/sentry.ts`

```typescript
import * as Sentry from "@sentry/node";
import { envVars } from "./env.js";

export function initSentry() {
  if (!envVars.SENTRY_DSN) {
    console.warn('SENTRY_DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: envVars.SENTRY_DSN,
    environment: envVars.NODE_ENV,
    tracesSampleRate: envVars.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true })
    ]
  });
}

export function sentryErrorHandler(err: any, req: any, res: any, next: any) {
  Sentry.captureException(err, {
    contexts: {
      express: {
        method: req.method,
        url: req.originalUrl,
        user: req.user?.userId
      }
    }
  });
  next(err);
}
```

### Step 3: Initialize in server.ts

```typescript
// At top of bootstrap function
import { initSentry, sentryErrorHandler } from "./app/config/sentry.js";

const bootstrap = async () => {
  try {
    initSentry();
    // ... rest of bootstrap
  }
};
```

### Step 4: Add .env Configuration

```env
SENTRY_DSN=https://your-sentry-key@sentry.io/project-id
```

---

## 🚦 PHASE 3: RATE LIMITING (Week 2)

### Objective
Protect critical endpoints from abuse.

### Step 1: Install Dependencies

```bash
npm install express-rate-limit
npm install --save-dev @types/express-rate-limit
```

### Step 2: Create Rate Limit Middleware

**File:** `backend/src/app/middleware/rateLimit.ts`

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../lib/redis.js';

// Auth endpoints: 5 attempts per 15 minutes
export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'auth-limit:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Report endpoints: 10 per hour per user
export const reportLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'report-limit:',
  }),
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `${req.user?.userId || req.ip}`,
  message: 'Too many report requests, please try again later',
});

// API general: 100 per 15 minutes
export const generalLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'api-limit:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
});
```

### Step 3: Apply to Routes

**File:** `backend/src/app/routes/index.ts`

```typescript
import { authLimiter, reportLimiter } from "../middleware/rateLimit.js";

router.use("/auth", authLimiter, AuthRoutes);
router.use("/reports", reportLimiter, ReportRoutes);
```

---

## 📚 PHASE 3B: API DOCUMENTATION (Week 2)

### Objective
Generate OpenAPI/Swagger documentation.

### Step 1: Install Dependencies

```bash
npm install swagger-ui-express swagger-jsdoc
npm install --save-dev @types/swagger-jsdoc @types/swagger-ui-express
```

### Step 2: Create Swagger Configuration

**File:** `backend/src/app/config/swagger.ts`

```typescript
import swaggerJsdoc from 'swagger-jsdoc';
import { envVars } from './env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CSE-CNS API',
      version: '1.0.0',
      description: 'Exchange Clearing & Settlement API'
    },
    servers: [
      {
        url: envVars.API_BASE_URL || 'http://localhost:5000/api/v1',
        description: 'API Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/app/routes/**/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
```

### Step 3: Add Swagger Routes

**File:** `backend/src/app.ts`

```typescript
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './app/config/swagger.js';

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

### Step 4: Document Routes with JSDoc

Add JSDoc comments to route handlers:

```typescript
/**
 * @swagger
 * /reports/request:
 *   post:
 *     summary: Request a new report
 *     tags:
 *       - Reports
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportType:
 *                 type: string
 *               format:
 *                 type: string
 *     responses:
 *       202:
 *         description: Report generation queued
 */
const requestReport = catchAsync(async (req: Request, res: Response) => {
  // ...
});
```

---

## ✅ SUCCESS CRITERIA

After completing all phases:

- [ ] No `console.log` in production code
- [ ] All console.log replaced with logger
- [ ] 10+ unit tests passing
- [ ] Health endpoints working (`/health`, `/ready`)
- [ ] Sentry configured and receiving errors
- [ ] Rate limiting on critical endpoints
- [ ] Swagger docs available at `/api/docs`
- [ ] Logs are structured JSON
- [ ] Correlation IDs in all logs
- [ ] Request logging middleware active

---

## 📊 Progress Tracking

Use this checklist to track implementation:

### Week 1
- [ ] Winston logger installed & configured
- [ ] All console.log replaced with logger
- [ ] Correlation ID middleware added
- [ ] Request logging middleware working
- [ ] Jest installed & configured
- [ ] First tests written & passing
- [ ] Health endpoints created
- [ ] Readiness endpoint complete

### Week 2
- [ ] Sentry integrated
- [ ] Rate limiting applied
- [ ] Swagger documentation setup
- [ ] API routes documented
- [ ] All critical endpoints rate-limited

### Week 3+
- [ ] Service layer tests (80%+ coverage)
- [ ] Integration tests for APIs
- [ ] Input sanitization complete
- [ ] Metrics/Prometheus setup

---

## 🔍 Validation Commands

```bash
# Check logger is working
npm run dev
grep "Combined log" logs/combined.log

# Run tests
npm run test
npm run test:coverage

# Check health endpoints
curl http://localhost:5000/api/v1/health
curl http://localhost:5000/api/v1/health/ready

# View Swagger docs
open http://localhost:5000/api/docs

# Check rate limiting
for i in {1..6}; do curl -i http://localhost:5000/api/v1/auth/login; done
```

---

## 🎯 Next: Follow implementation in order

1. Start with **Phase 1: Logging** (highest impact, fastest)
2. Then **Phase 1B: Testing** (foundational)
3. Then **Phase 2: Health & Readiness** (production requirement)
4. Then **Phase 2B: Sentry** (error tracking)
5. Then **Phase 3: Rate Limiting & Docs** (security & usability)

