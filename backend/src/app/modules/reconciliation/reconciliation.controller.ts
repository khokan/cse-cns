import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { logger } from "../../utils/logger.js";
import { ReconciliationService } from "./reconciliation.service.js";

// ---------------------------------------------------------------------------
// GET /api/v1/reconciliation/summary?date=YYYY-MM-DD
// Restricted to ADMIN / IT (enforced via checkAuth in the route layer).
// Defaults to 2024-06-02 (sample dataset date) when no ?date is provided.
// ---------------------------------------------------------------------------
const getSummary = catchAsync(async (req: Request, res: Response) => {
    const requestedBy = req.user?.userId ?? "unknown";
    const { date } = req.query as { date?: string };
    logger.info("Reconciliation summary requested", { userId: requestedBy, date });

    const result = await ReconciliationService.getReconciliationSummary(date);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Reconciliation summary fetched successfully.",
        data: result,
    });
});

export const ReconciliationController = {
    getSummary,
};
