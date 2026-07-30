import { Router } from "express";
import { DatatableController } from "./datatable.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { UserRole } from "../../types/auth.types.js";

const router = Router();

// List all tables accessible for the authenticated user's role
router.get(
    "/",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING),
    DatatableController.getAccessibleTables
);

// Generic CRUD endpoints — role enforcement is checked against registry in service layer
router.get(
    "/:table",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING),
    DatatableController.listRows
);

router.get(
    "/:table/:id",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING),
    DatatableController.getRow
);

router.post(
    "/:table",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING),
    DatatableController.createRow
);

router.patch(
    "/:table/:id",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING),
    DatatableController.updateRow
);

router.delete(
    "/:table/:id",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING),
    DatatableController.deleteRow
);

export const DatatableRoutes = router;
