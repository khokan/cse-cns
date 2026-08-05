// src/app/modules/security/security.route.ts

import { Router } from "express";
import { SecurityController } from "./security.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { UserRole } from "../../types/auth.types.js";

const router = Router();

// All security management endpoints — ADMIN only
const adminOnly = checkAuth(UserRole.ADMIN);

// ─── Roles ────────────────────────────────────────────────────────────────────
router.get("/roles", adminOnly, SecurityController.getRoles);
router.post("/roles", adminOnly, SecurityController.createRole);
router.get("/roles/:id", adminOnly, SecurityController.getRole);
router.patch("/roles/:id", adminOnly, SecurityController.updateRole);
router.delete("/roles/:id", adminOnly, SecurityController.deleteRole);

// Role ↔ Permission matrix
router.get("/roles/:id/permissions", adminOnly, SecurityController.getRolePermissions);
router.put("/roles/:id/permissions", adminOnly, SecurityController.updateRolePermissions);

// ─── Permissions ──────────────────────────────────────────────────────────────
router.get("/permissions", adminOnly, SecurityController.getPermissions);
router.post("/permissions", adminOnly, SecurityController.createPermission);

// ─── User ↔ Role & Policies ───────────────────────────────────────────────────
router.get("/users/:userId/roles", adminOnly, SecurityController.getUserRoles);
router.put("/users/:userId/roles", adminOnly, SecurityController.updateUserRoles);
router.get("/users/:userId/policies", adminOnly, SecurityController.getUserPolicies);
router.put("/users/:userId/policies", adminOnly, SecurityController.updateUserPolicies);

// ─── My Permissions (accessible by any logged-in user) ─────────────────────
router.get("/my-permissions", checkAuth(), SecurityController.getMyPermissions);

// ─── Seed (run once after migration) ─────────────────────────────────────────
router.post("/seed", adminOnly, SecurityController.seedDefaults);

export const SecurityRoutes = router;

