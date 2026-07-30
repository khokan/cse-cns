import { db } from "../../lib/prisma.js";
import { AdminUserQuery, UpdateUserDto, AuditLogQuery } from "./admin.interface.js";
import { writeAuditLog } from "../../utils/auditLog.js";
import AppError from "../../errorHelpers/AppError.js";
import status from "http-status";

const getUsers = async (query: AdminUserQuery) => {
    const page = parseInt(query.page ?? "1", 10);
    const limit = parseInt(query.limit ?? "10", 10);
    const skip = (page - 1) * limit;

    const where = {
        isDeleted: false,
        ...(query.role ? { role: query.role } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.search
            ? {
                  OR: [
                      { name: { contains: query.search } },
                      { email: { contains: query.search } },
                      { trecHolderId: { contains: query.search } },
                  ],
              }
            : {}),
    };

    const [users, total] = await Promise.all([
        db.cnsWeb.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                trecHolderId: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        }),
        db.cnsWeb.user.count({ where }),
    ]);

    return {
        data: users,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const getUser = async (id: string) => {
    const user = await db.cnsWeb.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            trecHolderId: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found.");
    }

    return user;
};

const updateUser = async (id: string, dto: UpdateUserDto, adminUserId: string) => {
    const existing = await getUser(id);

    const updated = await db.cnsWeb.user.update({
        where: { id },
        data: dto,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            trecHolderId: true,
            updatedAt: true,
        },
    });

    writeAuditLog({
        userId: adminUserId,
        action: "ADMIN_USER_UPDATE",
        entity: "User",
        entityId: id,
        payload: dto as Record<string, unknown>,
    });

    return updated;
};

const deleteUser = async (id: string, adminUserId: string) => {
    await getUser(id);

    const softDeleted = await db.cnsWeb.user.update({
        where: { id },
        data: { isDeleted: true, status: "DELETED", deletedAt: new Date() },
    });

    writeAuditLog({
        userId: adminUserId,
        action: "ADMIN_USER_DELETE",
        entity: "User",
        entityId: id,
    });

    return softDeleted;
};

const getDashboardStats = async () => {
    const [totalUsers, activeUsers, totalReportJobs, completedReportJobs, totalSettlements] = await Promise.all([
        db.cnsWeb.user.count({ where: { isDeleted: false } }),
        db.cnsWeb.user.count({ where: { isDeleted: false, status: "ACTIVE" } }),
        db.cnsWeb.reportJob.count(),
        db.cnsWeb.reportJob.count({ where: { status: "COMPLETED" } }),
        db.cns.settlement.count(),
    ]);

    return {
        totalUsers,
        activeUsers,
        totalReportJobs,
        completedReportJobs,
        totalSettlements,
    };
};

const getAuditLogs = async (query: AuditLogQuery) => {
    const page = parseInt(query.page ?? "1", 10);
    const limit = parseInt(query.limit ?? "10", 10);
    const skip = (page - 1) * limit;

    const where = {
        ...(query.action ? { action: query.action } : {}),
        ...(query.entity ? { entity: query.entity } : {}),
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.dateFrom || query.dateTo
            ? {
                  createdAt: {
                      ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
                      ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
                  },
              }
            : {}),
    };

    const [logs, total] = await Promise.all([
        db.cnsWeb.auditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        db.cnsWeb.auditLog.count({ where }),
    ]);

    return {
        data: logs,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const AdminService = {
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    getDashboardStats,
    getAuditLogs,
};
