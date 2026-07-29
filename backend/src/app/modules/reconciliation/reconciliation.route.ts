import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth.js";
import { UserRole } from "../../types/auth.types.js";
import { ReconciliationController } from "./reconciliation.controller.js";

const router = Router();

// Strictly restricted to ADMIN and IT roles — TRECHOLDER has no access.
router.get(
    "/summary",
    checkAuth(UserRole.ADMIN, UserRole.IT),
    ReconciliationController.getSummary
);

export const ReconciliationRoutes = router;
