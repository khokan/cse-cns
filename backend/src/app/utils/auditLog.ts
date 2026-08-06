import { Request } from "express";
import { db } from "../lib/prisma.js";

export type AuditAction =
    | "LOGIN"
    | "LOGOUT"
    | "REGISTER"
    | "PASSWORD_CHANGE"
    | "REPORT_REQUESTED"
    | "REPORT_CANCELLED"
    | "REPORT_DELETED"
    | "SETTLEMENT_INITIATED"
    | "SETTLEMENT_CANCELLED"
    | "SETTLEMENT_RETRIED"
    | "CRUD_CREATE"
    | "CRUD_UPDATE"
    | "CRUD_DELETE"
    | "ADMIN_USER_CREATE"
    | "ADMIN_USER_UPDATE"
    | "ADMIN_USER_ROLE_CHANGE"
    | "ADMIN_USER_STATUS_CHANGE"
    | "ADMIN_USER_DELETE"
    | "SECURITY_ROLE_CREATE"
    | "SECURITY_ROLE_UPDATE"
    | "SECURITY_ROLE_DELETE"
    | "SECURITY_PERMISSION_CREATE"
    | "SECURITY_ROLE_PERMISSIONS_UPDATE"
    | "SECURITY_USER_ROLES_UPDATE"
    | "SECURITY_USER_POLICIES_UPDATE";

export interface WriteAuditLogParams {
    userId?: string;
    userEmail?: string;
    action: AuditAction;
    entity: string;
    entityId?: string;
    payload?: Record<string, unknown>;
    req?: Request;
}

/**
 * Fire-and-forget Audit Log writer.
 * Never throws errors to avoid blocking business execution.
 */
export const writeAuditLog = (params: WriteAuditLogParams): void => {
    const { userId, userEmail, action, entity, entityId, payload, req } = params;

    let ipAddress: string | undefined = undefined;
    let userAgent: string | undefined = undefined;

    if (req) {
        ipAddress =
            (req.headers["x-forwarded-for"] as string) ||
            req.socket?.remoteAddress ||
            undefined;
        userAgent = req.headers["user-agent"] || undefined;
    }

    db.cnsWeb.auditLog
        .create({
            data: {
                userId: userId ?? (req as any)?.user?.userId ?? null,
                userEmail: userEmail ?? (req as any)?.user?.email ?? null,
                action,
                entity,
                entityId,
                payload: payload ? JSON.stringify(payload) : null,
                ipAddress,
                userAgent,
            },
        })
        .catch((err) => {
            console.error("⚠️ [AuditLog] Failed to write audit log entry:", err);
        });
};
