# Role-Based Access Control (RBAC) — Full-Stack Implementation

> **Version**: 2.0 — Dynamic RBAC + Policy Engine  
> **Supersedes**: Legacy hardcoded `rolePermissions.ts` approach  
> **Status**: ✅ Implemented

---

## Overview

The system uses a **database-driven, policy-aware RBAC engine** where:

- Admins manage Roles, Permissions, and per-user Policy overrides through an Admin UI — **no code changes required**.
- Permissions are resolved at runtime from the database and cached in Redis.
- Frontend UI controls (buttons, actions) are gated by a live `GET /security/my-permissions` API call.

---

## Architecture

### Permission Resolution Chain

```
HTTP Request
  ↓
checkAuth(...allowedRoles)        — JWT/session validation, attaches req.user
  ↓
requirePermission(module, action) — optional fine-grained check
  ↓
permissionResolver.ts
  ├─ 1a. Load UserRole join table  (userId → Role → RolePermission → Permission)
  ├─ 1b. Fallback: Load User.role string (e.g. "TRECHOLDER" → Role lookup)
  ├─ 2.  Load Policy overrides     (per-user ALLOW/DENY)
  ├─ 3.  Merge: DENY always overrides ALLOW
  └─ 4.  Cache in Redis (TTL: 5 min, invalidated on role/policy change)
  ↓
Controller → Database
```

### Database Schema

```
┌──────────┐     ┌──────────────────┐     ┌────────────┐
│   Role   │────▶│  RolePermission  │◀────│ Permission │
└──────────┘     └──────────────────┘     └────────────┘
     ▲                                          ▲
     │                                          │
┌──────────┐     ┌──────────────┐     ┌─────────────────┐
│   User   │────▶│   UserRole   │     │     Policy      │
│(role str)│     └──────────────┘     │(ALLOW/DENY ovr) │
└──────────┘                          └─────────────────┘
```

**Models** (in `backend/prisma/cnsweb/auth.prisma`):

| Model | Purpose |
|-------|---------|
| `Role` | Named group of permissions (`ADMIN`, `TRECHOLDER`, `ACCOUNTING`, `IT`, `MARKETING`) |
| `Permission` | Atomic action: `module` + `action` (e.g. `challan:create`) |
| `RolePermission` | Join table: which permissions belong to which role |
| `UserRole` | Join table: explicit role assignments for a user (supplementary) |
| `Policy` | Per-user ALLOW/DENY override, supersedes role-level permissions |

---

## Backend Implementation

### Files

| File | Purpose |
|------|---------|
| `src/app/utils/permissionResolver.ts` | Core resolution logic + Redis cache |
| `src/app/middleware/requirePermission.ts` | Express middleware (additive, optional per-route) |
| `src/app/middleware/checkAuth.ts` | Existing JWT/session middleware (unchanged) |
| `src/app/modules/security/security.service.ts` | CRUD for roles, permissions, user roles, policies |
| `src/app/modules/security/security.controller.ts` | HTTP handlers |
| `src/app/modules/security/security.route.ts` | Routes — all ADMIN-only except `/my-permissions` |
| `src/app/types/security.types.ts` | Shared enums, DTOs, defaults |
| `src/app/utils/seed.ts` | Seeds default roles & permissions on startup |

### Permission Resolution (`permissionResolver.ts`)

```typescript
// Two-source role resolution:
// 1a. UserRole join table (explicit assignments)
// 1b. User.role string column (e.g. "TRECHOLDER" → looks up Role by name)
// Both sources are merged; Policy DENY always wins
async function loadUserPermissions(userId: string): Promise<CachedPermissions>
```

**Cache key**: `perm:{userId}` — invalidated whenever:
- `updateRolePermissions` is called (invalidates all users with that role, by both `UserRole` and `User.role`)
- `updateUserRoles` is called (invalidates that user)
- `updateUserPolicies` is called (invalidates that user)

### Middleware Usage

```typescript
import { checkAuth } from "../../middleware/checkAuth.js";
import { requirePermission } from "../../middleware/requirePermission.js";
import { UserRole } from "../../types/auth.types.js";

// Coarse-grained: role check only (existing pattern — unchanged)
router.get("/", checkAuth(UserRole.ADMIN, UserRole.TRECHOLDER), Controller.getAll);

// Fine-grained: role + permission check
router.post("/", checkAuth(UserRole.ADMIN), requirePermission("challan", "create"), Controller.create);
```

### Security API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/security/roles` | ADMIN | List all roles |
| `POST` | `/security/roles` | ADMIN | Create role |
| `GET` | `/security/roles/:id` | ADMIN | Get role detail |
| `PATCH` | `/security/roles/:id` | ADMIN | Update role label/description |
| `DELETE` | `/security/roles/:id` | ADMIN | Delete non-system role |
| `GET` | `/security/roles/:id/permissions` | ADMIN | Get role's permission matrix |
| `PUT` | `/security/roles/:id/permissions` | ADMIN | Bulk-replace role permissions |
| `GET` | `/security/permissions` | ADMIN | List all permissions (grouped by module) |
| `POST` | `/security/permissions` | ADMIN | Create permission |
| `GET` | `/security/users/:userId/roles` | ADMIN | Get user's assigned roles |
| `PUT` | `/security/users/:userId/roles` | ADMIN | Assign/revoke user roles |
| `GET` | `/security/users/:userId/policies` | ADMIN | Get user's policy overrides |
| `PUT` | `/security/users/:userId/policies` | ADMIN | Set user policy overrides |
| `GET` | `/security/my-permissions` | Any authed user | Get own resolved permission map |
| `POST` | `/security/seed` | ADMIN | Re-seed default roles & permissions |

### Default Permissions (seeded on startup)

Modules seeded: `challan`, `taxToNBR`, `report`, `settlement`, `user`, `security`

Actions per module: `create`, `read`, `update`, `delete`

Default role assignments:

| Role | challan | taxToNBR | report | settlement | user | security |
|------|---------|----------|--------|------------|------|----------|
| `ADMIN` | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD |
| `TRECHOLDER` | CR | CR | R | R | — | — |
| `ACCOUNTING` | CRU | CRU | R | RU | — | — |
| `IT` | R | R | R | R | R | — |
| `MARKETING` | R | R | R | — | — | — |

> These are starting defaults. Admins can override any permission per-role or per-user via the Security UI.

---

## Frontend Implementation

### Files

| File | Purpose |
|------|---------|
| `src/types/security.types.ts` | Role, Permission, Policy, DTO types |
| `src/services/security.service.ts` | API client for all security endpoints |
| `src/hooks/useMyPermissions.ts` | React Query hook — fetches live permissions |
| `src/components/ProtectedPage.tsx` | Page-level role gate |
| `src/components/modules/admin/RolePermissionMatrix.tsx` | Module × Action checkbox grid |
| `src/components/modules/admin/UserRoleAssignment.tsx` | Badge-based role assignment panel |
| `src/components/modules/admin/UserPolicyPanel.tsx` | Per-user ALLOW/DENY override panel |
| `src/app/(dashboardLayout)/admin/security/page.tsx` | Security Hub overview |
| `src/app/(dashboardLayout)/admin/security/roles/page.tsx` | Roles list |
| `src/app/(dashboardLayout)/admin/security/roles/[id]/page.tsx` | Role detail + permission matrix |
| `src/app/(dashboardLayout)/admin/security/permissions/page.tsx` | Permission catalog |
| `src/app/(dashboardLayout)/admin/security/users/[userId]/page.tsx` | User security (roles + policies) |

### `useMyPermissions` Hook

The central hook for **all** frontend permission checks. Calls `GET /security/my-permissions` on mount and window focus.

```typescript
import { useMyPermissions } from "@/hooks/useMyPermissions";

export function MyPage() {
  const { canCreate, canUpdate, canDelete, hasPermission } = useMyPermissions();

  const canCreateChallan = canCreate("challan");
  const canUpdateChallan = canUpdate("challan");
  const canDeleteChallan = canDelete("challan");

  return (
    <>
      {canCreateChallan && <Button>Create Challan</Button>}
      <DataTable
        onEdit={canUpdateChallan ? handleEdit : undefined}
        onDelete={canDeleteChallan ? handleDelete : undefined}
      />
    </>
  );
}
```

**Configuration:**
```typescript
{
  queryKey: ["my-permissions"],
  staleTime: 0,               // Always re-fetch on mount
  refetchOnMount: true,
  refetchOnWindowFocus: true,
}
```

### `ProtectedPage` Component

Used for page-level role-based gating (coarse-grained, role string check):

```tsx
import { ProtectedPage } from "@/components/ProtectedPage";

<ProtectedPage
  userRole={userRole}
  allowedRoles={["ADMIN", "IT", "ACCOUNTING", "TRECHOLDER"]}
  fallbackMessage="You don't have permission to access this page"
>
  {/* page content */}
</ProtectedPage>
```

### Cache Invalidation on Admin Save

When an admin saves a role's permission matrix via the Security UI, the frontend immediately invalidates the local React Query cache:

```typescript
// In roles/[id]/page.tsx — handleSaveMatrix
await queryClient.invalidateQueries({ queryKey: MY_PERMISSIONS_KEY });
```

This ensures the admin's own UI reflects the new permissions without a page reload.

---

## Permission Resolution Priority

```
Policy DENY  >  Policy ALLOW  >  Role-level ALLOW  >  No entry (DENY)
```

| Source | Effect | Priority |
|--------|--------|----------|
| `Policy` (per-user DENY) | ❌ Denies regardless of role | Highest |
| `Policy` (per-user ALLOW) | ✅ Explicitly granted | 2nd |
| `RolePermission` (role-level ALLOW) | ✅ Granted via role | 3rd |
| No entry at all | ❌ Denied by default | Lowest |

---

## Admin Security UI Navigation

Added to Admin sidebar under **Security**:

```
Security
├── /admin/security            — Security Hub overview
├── /admin/security/roles      — Roles list + create
│   └── /admin/security/roles/[id]  — Role detail + permission matrix
├── /admin/security/permissions — Permission catalog (read-only)
└── /admin/security/users/[userId]  — User roles + policy overrides
```

Access to per-user security management is also available from the Users table via the "Manage" button.

---

## Module Permission Map

Current permission modules and actions:

| Module | Actions | Notes |
|--------|---------|-------|
| `challan` | `create`, `read`, `update`, `delete` | Challan financial records |
| `taxToNBR` | `create`, `read`, `update`, `delete` | Tax to NBR records |
| `report` | `create`, `read`, `update`, `delete` | Report generation |
| `settlement` | `create`, `read`, `update`, `delete` | Settlements |
| `user` | `create`, `read`, `update`, `delete` | User management |
| `security` | `create`, `read`, `update`, `delete` | RBAC management |

---

## CRUD Permission Matrix Per Page

### `dashboard/challans` (TRECHOLDER dashboard)

| Action | Roles | Source |
|--------|-------|--------|
| View page | `TRECHOLDER`, `ADMIN` | `ProtectedPage.allowedRoles` |
| Create button | Dynamic | `useMyPermissions().canCreate("challan")` |
| Edit row action | Dynamic | `useMyPermissions().canUpdate("challan")` |
| Delete row action | Dynamic | `useMyPermissions().canDelete("challan")` |

### `admin/dashboard/challans` (Admin dashboard)

| Action | Roles | Source |
|--------|-------|--------|
| View page | `ADMIN`, `IT`, `ACCOUNTING`, `TRECHOLDER` | `ProtectedPage.allowedRoles` |
| Create button | Dynamic | `useMyPermissions().canCreate("challan")` |
| Edit row action | Dynamic | `useMyPermissions().canUpdate("challan")` |
| Delete row action | Dynamic | `useMyPermissions().canDelete("challan")` |

Same pattern applies to `dashboard/tax-to-nbr` and `admin/dashboard/tax-to-nbr`.

---

## Data Flow: How Permission Change Takes Effect

```
Admin changes role permission matrix in UI
  ↓
PUT /security/roles/:id/permissions
  ↓
security.service.ts: updateRolePermissions()
  ├─ Delete old RolePermission records
  ├─ Insert new RolePermission records
  ├─ Find all users by UserRole join table (where roleId = this role)
  ├─ Find all users by User.role string column (where role = role.name)
  └─ Invalidate Redis cache: cacheDel("perm:{userId}") for ALL affected users
  ↓
Frontend: queryClient.invalidateQueries({ queryKey: ["my-permissions"] })
  ↓
Next page navigation or window focus triggers useMyPermissions() refetch
  ↓
GET /security/my-permissions → fresh resolved permissions
  ↓
UI controls (buttons, row actions) update immediately
```

---

## Known Behaviour Notes

1. **Dual Role Sources**: Users are assigned roles in two ways:
   - `User.role` string column (legacy, set at registration/admin assignment)
   - `UserRole` join table (explicit RBAC assignment via Security UI)
   - Both sources are merged during permission resolution.

2. **DENY wins unconditionally**: A Policy DENY on a user overrides any role-level ALLOW for the same permission.

3. **Cache TTL**: Redis permission cache expires after 5 minutes. Cache is also invalidated immediately on any role/policy change.

4. **Frontend staleTime = 0**: `useMyPermissions()` always refetches on component mount and window focus, ensuring UI reflects any admin-side changes within one navigation.

5. **Backend enforcement**: Frontend checks are UX-only. All write endpoints still validate roles via `checkAuth()` on the backend. The `requirePermission()` middleware can be added incrementally per route for fine-grained enforcement.

---

## Security Best Practices

- ✅ Frontend RBAC is **UX-only** — never trust client-side checks for security.
- ✅ Backend `checkAuth()` validates JWT/session on every request.
- ✅ `requirePermission()` middleware can be added per-route for fine-grained API enforcement.
- ✅ All security management actions are ADMIN-only.
- ✅ Audit log entries are written for all RBAC changes (`writeAuditLog`).
- ✅ System roles (`isSystem: true`) cannot be deleted via API.
- ✅ Redis cache is invalidated immediately on permission changes — no stale grants.
