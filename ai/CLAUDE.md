# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo currently contains a single `backend/` service (Express + TypeScript API). A `frontend` is implied by the project path but is not present yet. Run all commands from `backend/`.

## Commands

```bash
cd backend
pnpm install            # packageManager is pnpm@10.28.0 (a package-lock.json is also present)
pnpm dev                # tsx watch src/server.ts  (dev server with reload)
pnpm build              # tsc  -> dist/
pnpm start              # node dist/server.js
pnpm lint               # eslint ./src/**/*
pnpm generate           # prisma generate  (regenerate client after ANY schema change)
pnpm migrate            # prisma migrate dev
pnpm push               # prisma db push
pnpm studio             # prisma studio
```

There is currently **no test runner** (`pnpm test` just errors) and **no `tsconfig.json` or eslint config file committed**, even though `build`/`lint` reference `tsc`/`eslint` — add these before relying on those scripts.

## Stack

- **Runtime**: Node ESM (`"type": "module"`), Express 5, TypeScript, run via `tsx` in dev.
- **DB**: Microsoft SQL Server via Prisma 7 using the `@prisma/adapter-mssql` driver adapter.
- **Auth**: `better-auth` (email/password + OTP email verification + Google OAuth).
- Other: `nodemailer` + `ejs` templates for email, `cloudinary`/`multer` for uploads, `stripe`, `pdfkit`, `node-cron`, `zod` for validation.

## Architecture

### Feature module pattern
Features live under `src/app/<feature>/` and split into four files: `<feature>.route.ts` (Express router), `<feature>.controller.ts` (HTTP layer), `<feature>.service.ts` (business logic + Prisma/better-auth calls), and `<feature>.interface.ts` (payload types). `auth/` is the reference example. Controllers wrap handlers in `catchAsync` and reply via `sendResponse` (both expected under `src/app/shared/` — not yet created).

### Prisma setup (non-standard)
- Schema is **split across multiple files** in `backend/prisma/schema/` (`schema.prisma`, `auth.prisma`, `member.prisma`). `prisma.config.ts` points `schema` at the `prisma/schema` directory.
- The generated client is emitted to **`src/generated/prisma/`** (not `node_modules`). Import Prisma types from there (e.g. `../../generated/prisma/client`), and re-run `pnpm generate` after editing any schema file.
- `src/app/lib/prisma.ts` hand-parses the `sqlserver://host:port;database=..;user=..;password=..` connection string into an `mssql` adapter config (encrypt off, trustServerCertificate on). `DATABASE_URL_CNSWEB` must be in that `sqlserver://` form.

### Auth flow (dual-token)
`better-auth` (configured in `src/app/lib/auth.ts`) is the source of truth for identity, but the service layer *also* issues its own JWT access/refresh tokens. A logged-in client therefore holds **three cookies**: `accessToken` (custom JWT), `refreshToken` (custom JWT), and `better-auth.session_token`. `middleware/checkAuth.ts` validates the better-auth session against the DB *and* verifies the custom access-token JWT, then populates `req.user`. Extra user fields (`role`, `status`, `needPasswordChange`, `isDeleted`, `deletedAt`) are declared as better-auth `additionalFields`. `seedSuperAdmin()` (`utils/seed.ts`) runs on bootstrap to create the admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

### Errors
`globalErrorHandler.ts` normalizes `AppError`, Zod errors, and each Prisma error subtype (via `errorHelpers/`) into a consistent `{ success, message, errorSources, stack? }` shape (stack/error only in `NODE_ENV=development`). Throw `AppError(status, message)` for expected failures.

### QueryBuilder
`utils/QueryBuilder.ts` is a chainable helper over a Prisma model delegate: `.search().filter().sort().paginate().fields().include(...).execute()`. It supports dotted paths for nested relations (`user.name`, `specialities.speciality.title`), range operators via bracket query params (`?fee[lt]=100`), and `?include=`/`?fields=` selection. Returns `{ data, meta: { page, limit, total, totalPages } }`.

## Current state / gotchas

This backend is early WIP repurposed from a doctor/TrecHolder template, so several things are inconsistent and will not compile/run end-to-end yet:

- `src/app.ts` only registers CORS + body parsers and a `/` health route. It does **not** yet mount `AuthRoutes`, `globalErrorHandler`, `notFound`, `cookie-parser`, or an EJS view engine (needed by `authController.googleLogin`, which calls `res.render`).
- **Role mismatch**: `types/auth.types.ts` defines roles `ADMIN, IT, ACCOUNTING, TRECHOLDER, MARKETING`, but `auth.route.ts` and `auth.service.ts` reference `SUPER_ADMIN`, `DOCTOR`, `TrecHolder` and Prisma models (`TrecHolder`, `doctor`, `admin`, `appointments`, …) that do not exist in the current schema.
- `lib/auth.ts` sets the better-auth `prismaAdapter` provider to `"postgresql"` while the actual database is SQL Server.

When adding real features, expect to reconcile the role enum with the routes/services and to add the missing schema models + `shared/` helpers.
