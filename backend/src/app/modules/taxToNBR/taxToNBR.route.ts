import { Router } from "express";
import { TaxToNBRController } from "./taxToNBR.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { UserRole } from "../../types/auth.types.js";

const router = Router();

// Get all Tax to NBR records
router.get(
    "/",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING, UserRole.TRECHOLDER),
    TaxToNBRController.getAllTaxToNBRs
);

// Get Tax to NBR record by ID
router.get(
    "/:id",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING, UserRole.TRECHOLDER),
    TaxToNBRController.getTaxToNBRById
);

// Create Tax to NBR record
router.post(
    "/",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING),
    TaxToNBRController.createTaxToNBR
);

// Update Tax to NBR record
router.patch(
    "/:id",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING),
    TaxToNBRController.updateTaxToNBR
);

// Delete Tax to NBR record
router.delete(
    "/:id",
    checkAuth(UserRole.ADMIN, UserRole.IT),
    TaxToNBRController.deleteTaxToNBR
);

export const TaxToNBRRoutes = router;
