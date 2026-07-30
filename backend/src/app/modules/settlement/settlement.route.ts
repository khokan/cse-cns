import { Router } from "express";
import { SettlementController } from "./settlement.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { UserRole } from "../../types/auth.types.js";

const router = Router();

// IT and ADMIN can trigger settlements
router.post(
    "/trigger",
    checkAuth(UserRole.IT, UserRole.ADMIN),
    SettlementController.triggerSettlement
);

// ADMIN, IT, ACCOUNTING can list and view settlement records
router.get(
    "/",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING),
    SettlementController.getSettlements
);

router.get(
    "/:contractNumber",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING),
    SettlementController.getSettlementByContractNumber
);

// IT and ADMIN can retry failed settlement jobs
router.post(
    "/:contractNumber/retry",
    checkAuth(UserRole.IT, UserRole.ADMIN),
    SettlementController.retrySettlement
);

export const SettlementRoutes = router;
