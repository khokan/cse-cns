# Authentication (Better Auth), Tokens & Cookies

## Library: Better Auth
Both backend and frontend use [`better-auth`](https://better-auth.com) instead of a hand-rolled auth system.

### Backend Configuration (`backend/src/app/lib/auth.ts`)
```ts
export const auth = betterAuth({
  baseURL: envVars.BETTER_AUTH_URL,
  secret: envVars.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, requireEmailVerification: false },
  ...
});
```
- **Adapter:** `prismaAdapter` persists users/sessions/accounts/verifications into the `cnsweb` PostgreSQL database (`User`, `Session`, `Account`, `Verification` models — see DB document).
- **Credential login:** email/password enabled.
- **Social login:** Google OAuth (`socialProviders.google`), with `mapProfileToUser` defaulting new social sign-ups to role `TRECHOLDER`, status `ACTIVE`, `emailVerified: true`.
- **Database hooks:** `user.create.before` forces `emailVerified: true` on creation (app-specific policy).
- **Custom user fields:** `role`, `trecHolderId`, `status`, `needPasswordChange`, `isDeleted`, `deletedAt` — extending better-auth's base `User` model with domain-specific fields (defined via `user.additionalFields`).
- **Plugins:**
  - `bearer()` — enables Bearer token auth (useful for API clients beyond cookie-based browser sessions).
  - `emailOTP()` — custom email OTP verification flow (`sendVerificationOTP`) that emails a one-time code via `utils/email.ts`, with a special case to **skip OTP for ADMIN users**.

### Session Verification Middleware (`middleware/checkAuth.ts`)
```ts
const session = await betterAuth.api.getSession({ headers: fromNodeHeaders(req.headers) });
```
- Uses better-auth's server API to validate the session from incoming request headers/cookies — **not** manual JWT verification for session cookies (better-auth internally hashes/compares the session token against the DB, so the raw cookie value differs from what's stored).
- Throws `401` if no valid session; `403` if email isn't verified.
- Populates `req.user = { userId, email, role }` for downstream role checks (`authRoles` param enables per-route RBAC, e.g. `checkAuth("ADMIN")`).

## JWT Utilities (`utils/jwt.ts`)
A generic `jwtUtils` (`createToken`, `verifyToken`, `decodeToken`) wraps `jsonwebtoken`, used for **auxiliary tokens** outside of better-auth's own session mechanism (e.g. custom purpose-built tokens such as email verification links or service-to-service tokens), rather than for primary session auth (which is delegated to better-auth).

## Cookie Utilities (`utils/cookie.ts`)
`CookieUtils` (`setCookie`, `getCookie`, `clearCookie`) wraps Express's `res.cookie`/`req.cookies`/`res.clearCookie` for any app-specific cookies set outside of better-auth's own session cookie (which better-auth manages internally).

## Frontend Auth Client (`frontend/src/lib/auth-client.ts`)
```ts
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  fetchOptions: { credentials: "include" },
});
```
- `credentials: "include"` ensures the better-auth session cookie is sent on cross-origin requests between the Next.js frontend and Express backend.
- `signOutUser()` calls `authClient.signOut()` (clears better-auth session) **and** hits a Next.js API route `/api/ui/logout` as a fallback, guaranteeing any server-set cookies scoped to the Next.js domain are also cleared reliably.

## Token & Cookie Flow (End-to-End)
1. **Login** (email/password or Google OAuth) → better-auth creates a `Session` row (hashed token) and sets an HttpOnly session cookie on the response.
2. **Subsequent requests** — browser automatically sends the cookie (`credentials: "include"`); `checkAuth` middleware calls `auth.api.getSession()` to validate it server-side against the `Session`/`Account` tables.
3. **Bearer alternative** — the `bearer()` plugin allows non-cookie clients to authenticate via `Authorization: Bearer <token>` header instead of cookies.
4. **Email verification / OTP** — `emailOTP` plugin sends a one-time code (skipped for admins); `Verification` table stores the pending code with an expiry.
5. **Logout** — `authClient.signOut()` invalidates the session server-side; the frontend also calls `/api/ui/logout` to force-clear any residual cookies client-side.
6. **Role-based authorization** — `req.user.role` (sourced from the custom `role` field on `User`) is checked in `checkAuth(...roles)` for route-level RBAC, and again in the datatable registry's `readRoles`/`writeRoles` for table-level RBAC.

## Why Better Auth (vs. plain JWT)
- Handles session storage/rotation, OAuth, and email verification out of the box with a Prisma adapter, reducing custom auth code surface.
- Sessions are database-backed (revocable/inspectable via the `Session` table) rather than purely stateless JWTs, improving security posture (e.g., instant revocation on logout/ban).
- Plain JWT utilities are still retained for narrower, non-session use cases where a stateless signed token is appropriate.
