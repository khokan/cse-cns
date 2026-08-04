import { Router } from "express";
import { ChallanController } from "./challan.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { UserRole } from "../../types/auth.types.js";

const router = Router();

// Get all Challans
router.get(
    "/",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.TRECHOLDER),
    ChallanController.getAllChallans
);

// Get Challan by ID
router.get(
    "/:id",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.TRECHOLDER),
    ChallanController.getChallanById
);

// Create Challan
router.post(
    "/",
    checkAuth(UserRole.ADMIN, UserRole.IT),
    ChallanController.createChallan
);

// Update Challan
router.patch(
    "/:id",
    checkAuth(UserRole.ADMIN, UserRole.IT),
    ChallanController.updateChallan
);

// Delete Challan
router.delete(
    "/:id",
    checkAuth(UserRole.ADMIN, UserRole.IT),
    ChallanController.deleteChallan
);

export const ChallanRoutes = router;
