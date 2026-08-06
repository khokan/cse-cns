import { db } from "../../lib/prisma.js";
import { auth } from "../../lib/auth.js";
import {
    AdminUserQuery,
    AuditLogQuery,
    CreateUserDto,
    ToggleUserStatusDto,
    UpdateUserDto,
    UpdateUserRoleDto,
} from "./admin.interface.js";
import { writeAuditLog } from "../../utils/auditLog.js";
import { invalidateUserPermissionCache } from "../../utils/permissionResolver.js";
import AppError from "../../errorHelpers/AppError.js";
import { UserStatus, VALID_ROLES } from "../../types/auth.types.js";
import status from "http-status";

// ─── Helper ────────────────────────────────────────────────────────────────────

const userSelect = {
    id: true,
    name: true,
    email: true,
    status: true,
    trecHolderId: true,
    emailVerified: true,
    needPasswordChange: true,
    createdAt: true,
    updatedAt: true,
    userRoles: {
        select: {
            role: {
                select: {
                    name: true,
                },
            },
        },
    },
};

function formatUser<T extends { userRoles?: { role: { name: string } }[] }>(user: T) {
    const { userRoles, ...rest } = user;
    return {
        ...rest,
        role: userRoles?.[0]?.role?.name ?? "TRECHOLDER",
    };
}

// ─── Read ──────────────────────────────────────────────────────────────────────

const getUsers = async (query: AdminUserQuery) => {
    const page = parseInt(query.page ?? "1", 10);
    const limit = parseInt(query.limit ?? "10", 10);
    const skip = (page - 1) * limit;

    const where = {
        isDeleted: false,
        ...(query.role ? { userRoles: { some: { role: { name: query.role } } } } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.search
            ? {
                  OR: [
                      { name: { contains: query.search, mode: "insensitive" as const } },
                      { email: { contains: query.search, mode: "insensitive" as const } },
                      { trecHolderId: { contains: query.search, mode: "insensitive" as const } },
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
            select: userSelect,
        }),
        db.cnsWeb.user.count({ where }),
    ]);

    return {
        data: users.map(formatUser),
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
        where: { id, isDeleted: false },
        select: userSelect,
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found.");
    }

    return formatUser(user);
};

// ─── Create ────────────────────────────────────────────────────────────────────

const createUser = async (dto: CreateUserDto, actorId: string) => {
    if (!VALID_ROLES.includes(dto.role as never)) {
        throw new AppError(status.BAD_REQUEST, `Invalid role '${dto.role}'.`);
    }

    const existing = await db.cnsWeb.user.findUnique({ where: { email: dto.email } });
    if (existing) {
        throw new AppError(status.CONFLICT, "A user with this email already exists.");
    }

    // Create via Better Auth so password hashing & account relations are managed
    const result = await auth.api.signUpEmail({
        body: {
            name: dto.name,
            email: dto.email,
            password: dto.password,
        },
    });

    if (!result?.user?.id) {
        throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to create user account.");
    }

    const userId = result.user.id;

    // Set initial status to INACTIVE, flag password change, set optional trecHolderId
    await db.cnsWeb.user.update({
        where: { id: userId },
        data: {
            status: UserStatus.INACTIVE,
            needPasswordChange: true,
            emailVerified: true,
            ...(dto.trecHolderId ? { trecHolderId: dto.trecHolderId } : {}),
        },
    });

    // Assign Role in RBAC UserRole table
    const targetRole = await db.cnsWeb.role.findUnique({ where: { name: dto.role } });
    if (targetRole) {
        await db.cnsWeb.userRole.create({
            data: {
                userId,
                roleId: targetRole.id,
            },
        });
    }

    writeAuditLog({
        userId: actorId,
        action: "ADMIN_USER_CREATE",
        entity: "User",
        entityId: userId,
        payload: { name: dto.name, email: dto.email, role: dto.role } as Record<string, unknown>,
    });

    return getUser(userId);
};

// ─── Update (profile fields only) ─────────────────────────────────────────────

const updateUser = async (id: string, dto: UpdateUserDto, actorId: string) => {
    await getUser(id);

    const { name, email, trecHolderId } = dto;
    const safeDto = Object.fromEntries(
        Object.entries({ name, email, trecHolderId }).filter(([, v]) => v !== undefined)
    );

    await db.cnsWeb.user.update({
        where: { id },
        data: safeDto,
    });

    writeAuditLog({
        userId: actorId,
        action: "ADMIN_USER_UPDATE",
        entity: "User",
        entityId: id,
        payload: safeDto as Record<string, unknown>,
    });

    return getUser(id);
};

// ─── Update role (ADMIN only) ──────────────────────────────────────────────────

const updateUserRole = async (id: string, dto: UpdateUserRoleDto, actorId: string) => {
    if (!VALID_ROLES.includes(dto.role as never)) {
        throw new AppError(status.BAD_REQUEST, `Invalid role '${dto.role}'.`);
    }

    await getUser(id);

    const targetRole = await db.cnsWeb.role.findUnique({ where: { name: dto.role } });
    if (!targetRole) {
        throw new AppError(status.NOT_FOUND, `Role '${dto.role}' does not exist.`);
    }

    // Replace user roles in UserRole table
    await db.cnsWeb.userRole.deleteMany({ where: { userId: id } });
    await db.cnsWeb.userRole.create({
        data: {
            userId: id,
            roleId: targetRole.id,
        },
    });

    await invalidateUserPermissionCache(id);

    writeAuditLog({
        userId: actorId,
        action: "ADMIN_USER_ROLE_CHANGE",
        entity: "User",
        entityId: id,
        payload: { role: dto.role } as Record<string, unknown>,
    });

    return getUser(id);
};

// ─── Toggle status (ADMIN + ACCOUNTING) ───────────────────────────────────────

const toggleUserStatus = async (id: string, dto: ToggleUserStatusDto, actorId: string) => {
    const allowed: Array<ToggleUserStatusDto["status"]> = ["ACTIVE", "INACTIVE"];
    if (!allowed.includes(dto.status)) {
        throw new AppError(status.BAD_REQUEST, "Status must be ACTIVE or INACTIVE.");
    }

    await getUser(id);

    await db.cnsWeb.user.update({
        where: { id },
        data: { status: dto.status },
    });

    writeAuditLog({
        userId: actorId,
        action: "ADMIN_USER_STATUS_CHANGE",
        entity: "User",
        entityId: id,
        payload: { status: dto.status } as Record<string, unknown>,
    });

    return getUser(id);
};

// ─── Delete (soft) ────────────────────────────────────────────────────────────

const deleteUser = async (id: string, actorId: string) => {
    await getUser(id);

    const softDeleted = await db.cnsWeb.user.update({
        where: { id },
        data: { isDeleted: true, status: UserStatus.DELETED, deletedAt: new Date() },
    });

    await invalidateUserPermissionCache(id);

    writeAuditLog({
        userId: actorId,
        action: "ADMIN_USER_DELETE",
        entity: "User",
        entityId: id,
    });

    return softDeleted;
};

// ─── Dashboard stats ───────────────────────────────────────────────────────────

const getDashboardStats = async () => {
    const [totalUsers, activeUsers, totalReportJobs, completedReportJobs, totalSettlements] =
        await Promise.all([
            db.cnsWeb.user.count({ where: { isDeleted: false } }),
            db.cnsWeb.user.count({ where: { isDeleted: false, status: UserStatus.ACTIVE } }),
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

// ─── Audit logs ────────────────────────────────────────────────────────────────

const getAuditLogs = async (query: AuditLogQuery) => {
    const page = parseInt(query.page ?? "1", 10);
    const limit = parseInt(query.limit ?? "10", 10);
    const skip = (page - 1) * limit;

    const where = {
        ...(query.action ? { action: query.action } : {}),
        ...(query.entity ? { entity: query.entity } : {}),
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.search
            ? {
                  OR: [
                      { action: { contains: query.search } },
                      { entity: { contains: query.search } },
                      { userEmail: { contains: query.search } },
                      { entityId: { contains: query.search } },
                  ],
              }
            : {}),
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
    createUser,
    updateUser,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    getDashboardStats,
    getAuditLogs,
};
