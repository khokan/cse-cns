import { Router } from "express";
import { ReportController } from "./report.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { UserRole } from "../../types/auth.types.js";

const router = Router();

// All report routes require authentication
// TRECHOLDER can only see their own data — ownership enforced in the service layer

// Request a new report generation job
router.post(
    "/request",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING, UserRole.TRECHOLDER),
    ReportController.requestReport
);

// List report jobs (own jobs; ADMIN/IT can pass ?all=true for all users)
router.get(
    "/jobs",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING, UserRole.TRECHOLDER),
    ReportController.getJobs
);

// Get a single job by ID (ownership enforced in service)
router.get(
    "/jobs/:id",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING, UserRole.TRECHOLDER),
    ReportController.getJob
);

// Stream/download the generated report file
router.get(
    "/download/:id",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING, UserRole.TRECHOLDER),
    ReportController.downloadReport
);

// Bulk delete all report jobs (ADMIN only)
router.delete(
    "/jobs",
    checkAuth(UserRole.ADMIN, UserRole.IT),
    ReportController.deleteAllJobs
);

// Cancel/Delete a single job by ID
router.delete(
    "/jobs/:id",
    checkAuth(UserRole.ADMIN, UserRole.IT, UserRole.ACCOUNTING, UserRole.TRECHOLDER),
    ReportController.cancelJob
);

export const ReportRoutes = router;
