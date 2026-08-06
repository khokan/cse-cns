import { Router } from "express";
import { AdminController } from "./admin.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { UserRole } from "../../types/auth.types.js";

const router = Router();

// ─── Dashboard Stats & Audit Logs — ADMIN & IT ────────────────────────────────

router.get(
    "/stats",
    checkAuth(UserRole.ADMIN, UserRole.IT),
    AdminController.getDashboardStats
);

router.get(
    "/audit-logs",
    checkAuth(UserRole.ADMIN, UserRole.IT),
    AdminController.getAuditLogs
);

// ─── User List & Detail — ADMIN, IT & ACCOUNTING ──────────────────────────────

router.get(
    "/users",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING),
    AdminController.getUsers
);

router.get(
    "/users/:id",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING),
    AdminController.getUser
);

// ─── Create — ADMIN & ACCOUNTING ──────────────────────────────────────────────

router.post(
    "/users",
    checkAuth(UserRole.ADMIN, UserRole.ACCOUNTING),
    AdminController.createUser
);

// ─── Update profile (name, email, trecHolderId) — ADMIN & ACCOUNTING ──────────

router.patch(
    "/users/:id",
    checkAuth(UserRole.ADMIN, UserRole.ACCOUNTING),
    AdminController.updateUser
);

// ─── Change role — ADMIN only ──────────────────────────────────────────────────

router.patch(
    "/users/:id/role",
    checkAuth(UserRole.ADMIN),
    AdminController.updateUserRole
);

// ─── Toggle status (ACTIVE ↔ INACTIVE) — ADMIN & ACCOUNTING ──────────────────

router.patch(
    "/users/:id/status",
    checkAuth(UserRole.ADMIN, UserRole.ACCOUNTING),
    AdminController.toggleStatus
);

// ─── Delete (soft) — ADMIN only ───────────────────────────────────────────────

router.delete(
    "/users/:id",
    checkAuth(UserRole.ADMIN),
    AdminController.deleteUser
);

export const AdminRoutes = router;
