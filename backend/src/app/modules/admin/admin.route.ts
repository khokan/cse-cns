import { Router } from "express";
import { AdminController } from "./admin.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { UserRole } from "../../types/auth.types.js";

const router = Router();

// Dashboard Stats & Audit Logs — ADMIN & IT
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

// User Management — ADMIN & IT for view, ADMIN for mutate
router.get(
    "/users",
    checkAuth(UserRole.ADMIN, UserRole.IT),
    AdminController.getUsers
);

router.get(
    "/users/:id",
    checkAuth(UserRole.ADMIN, UserRole.IT),
    AdminController.getUser
);

router.patch(
    "/users/:id",
    checkAuth(UserRole.ADMIN),
    AdminController.updateUser
);

router.delete(
    "/users/:id",
    checkAuth(UserRole.ADMIN),
    AdminController.deleteUser
);

export const AdminRoutes = router;
