// src/app/middleware/requirePermission.ts
//
// Additive RBAC middleware — always placed AFTER checkAuth().
//
// Usage in routes:
//   router.get(
//     "/invoices",
//     checkAuth(UserRole.ACCOUNTING, UserRole.ADMIN),
//     requirePermission("invoice", "read"),
//     InvoiceController.getInvoices
//   );
//

import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { resolvePermission } from "../utils/permissionResolver.js";
import AppError from "../errorHelpers/AppError.js";

/**
 * requirePermission(module, action)
 *
 * Resolves the calling user's effective permission for the given module+action.
 * Attaches the result to `req.permission` for use in the controller.
 * Returns 403 if the user does not have this permission (via roles or policy).
 *
 * Must be placed after checkAuth() — relies on req.user being set.
 */
export const requirePermission = (module: string, action: string) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                throw new AppError(
                    status.UNAUTHORIZED,
                    "Unauthorized: No authenticated user found. Ensure checkAuth() runs before requirePermission()."
                );
            }

            const result = await resolvePermission(userId, module, action);

            if (!result.allowed) {
                throw new AppError(
                    status.FORBIDDEN,
                    `Forbidden: You do not have '${action}' permission on '${module}'.`
                );
            }

            // Attach resolved permission to the request for use in controllers
            req.permission = result;

            next();
        } catch (err) {
            next(err);
        }
    };
