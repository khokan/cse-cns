import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route.js";
import { ReportRoutes } from "../modules/reports/report.route.js";
import { SettlementRoutes } from "../modules/settlement/settlement.route.js";
import { DatatableRoutes } from "../modules/datatable/datatable.route.js";
import { AdminRoutes } from "../modules/admin/admin.route.js";
import { ReconciliationRoutes } from "../modules/reconciliation/reconciliation.route.js";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/reports", ReportRoutes);
router.use("/settlements", SettlementRoutes);
router.use("/data", DatatableRoutes);
router.use("/admin", AdminRoutes);
router.use("/reconciliation", ReconciliationRoutes);

export const IndexRoutes = router;