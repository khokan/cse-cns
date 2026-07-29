import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route.js";
import { ReportRoutes } from "../modules/reports/report.route.js";
import { ReconciliationRoutes } from "../modules/reconciliation/reconciliation.route.js";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/reports", ReportRoutes);
router.use("/reconciliation", ReconciliationRoutes);

export const IndexRoutes = router;