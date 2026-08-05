# RBAC + Policy — Full-Stack Implementation Plan

A zero-code-change permission management system. Admins manage Users, Roles, Permissions, and Policies entirely through the UI.

---

## Background

The current system has a flat `role` string column on the `User` model and a single `checkAuth(...roles)` middleware. It works for coarse-grained access but cannot express:

- **What** a user can do inside a module (Create / Read / Edit / Delete)
- **Per-user overrides** or policy inheritance (ALLOW / DENY)

This plan upgrades that foundation to a full RBAC + Policy system **without breaking any existing routes**.

---

## User Review Required

> [!IMPORTANT]
> **Database Migration**: New tables added to the `cnsweb` database. Existing data and routes are unaffected.

> [!WARNING]
> **Backward Compatibility**: The existing `checkAuth(...roles)` middleware and `role` field on `User` are preserved. New `requirePermission()` middleware is *additive*. You can migrate routes incrementally.

---

## Open Questions

1. **UI Framework for Security Pages**: Existing admin uses shadcn/ui + Tailwind.
2. **Seeding**: Automatically seeds default roles (ADMIN, IT, ACCOUNTING, TRECHOLDER, MARKETING) and their canonical permissions on startup.
3. **Permission granularity**: Per-module (e.g., `invoice:create`, `invoice:read`).
4. **Caching**: Resolved permissions are cached in Redis with a 5 min TTL.

---

## Proposed Changes

### Phase 1 — Database Schema (Prisma)

#### [MODIFY] [auth.prisma](file:///i:/CSE/Projects/Current/web-app/cse-cns/backend/prisma/cnsweb/auth.prisma)

Add new models alongside existing `User`, `Session`, `Account`, `Verification`:

```
┌──────────┐     ┌──────────────┐     ┌────────────┐
│   Role   │────▶│  RolePermission│◀───│ Permission │
└──────────┘     └──────────────┘     └────────────┘
     ▲                                      ▲
     │                                      │
┌──────────┐     ┌──────────────┐     ┌────────────┐
│  User    │────▶│   UserRole   │     │   Policy   │
└──────────┘     └──────────────┘     └────────────┘
```

**New Models:**

```prisma
// Role — named group of permissions (ADMIN, IT, ACCOUNTING …)
model Role {
  id          String           @id @default(uuid())
  name        String           @unique          // e.g. "ACCOUNTING"
  label       String                            // e.g. "Accounting Department"
  description String?
  isSystem    Boolean          @default(false)  // system roles cannot be deleted
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  permissions RolePermission[]
  userRoles   UserRole[]
}

// Permission — atomic action on a resource
model Permission {
  id          String           @id @default(uuid())
  module      String                            // e.g. "invoice", "settlement"
  action      String                            // "create" | "read" | "update" | "delete"
  label       String                            // "Create Invoice"
  description String?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  roles       RolePermission[]
  policies    Policy[]

  @@unique([module, action])
  @@index([module])
}

// RolePermission — join table between Role and Permission
model RolePermission {
  id           String     @id @default(uuid())
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@unique([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
}

// UserRole — a user may have multiple roles
model UserRole {
  id        String   @id @default(uuid())
  userId    String
  roleId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, roleId])
  @@index([userId])
}

// Policy — optional per-user permission override
model Policy {
  id           String     @id @default(uuid())
  userId       String
  permissionId String
  effect       String     @default("ALLOW")    // "ALLOW" | "DENY"
  reason       String?
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@unique([userId, permissionId])
  @@index([userId])
}
```

---

### Phase 2 — Backend Middleware & Services

**Pipeline (per request):**
```
Request
  ↓ checkAuth()       — validates JWT/session, attaches req.user (unchanged)
  ↓ requirePermission(module, action)
      ↓ Load user's roles (UserRole → Role → RolePermission → Permission)
      ↓ Load user's policies (ALLOW/DENY overrides)
      ↓ Resolve: DENY overrides ALLOW
      ↓ Attach req.permission = { allowed, module, action }
  ↓ Controller
  ↓ Database
```

---

### Phase 3 — Security CRUD APIs

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/security/roles` | List all roles |
| POST | `/security/roles` | Create role |
| PATCH | `/security/roles/:id` | Update role |
| DELETE | `/security/roles/:id` | Delete non-system role |
| GET | `/security/permissions` | List all permissions (grouped by module) |
| POST | `/security/permissions` | Create permission |
| GET | `/security/roles/:id/permissions` | Get role's permissions |
| PUT | `/security/roles/:id/permissions` | Bulk update role permissions |
| GET | `/security/users/:id/roles` | Get user's assigned roles |
| PUT | `/security/users/:id/roles` | Assign/revoke roles for a user |
| GET | `/security/users/:id/policies` | Get user's policy overrides |
| PUT | `/security/users/:id/policies` | Set user policy overrides |

All routes: `checkAuth(UserRole.ADMIN)`

---

### Phase 4 — Frontend Admin UI

**Key UI Components:**
- **`RolePermissionMatrix.tsx`**: Checkboxes per module × CRUD action.
- **`UserPolicyPanel.tsx`**: Per-user ALLOW/DENY override panel.
- **`UserRoleAssignment.tsx`**: Badge-based role assignment.

---

## File Summary

### Backend
- `prisma/cnsweb/auth.prisma` — Added Role, Permission, RolePermission, UserRole, Policy
- `src/app/middleware/requirePermission.ts`
- `src/app/utils/permissionResolver.ts`
- `src/app/modules/security/*`

### Frontend
- `src/types/security.types.ts`
- `src/services/security.service.ts`
- `src/app/(dashboardLayout)/admin/security/*`
- `src/components/modules/admin/*`
