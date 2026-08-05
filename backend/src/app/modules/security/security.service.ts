// src/app/modules/security/security.service.ts

import { db } from "../../lib/prisma.js";
import { writeAuditLog } from "../../utils/auditLog.js";
import { invalidateUserPermissionCache, getUserPermissions } from "../../utils/permissionResolver.js";
import AppError from "../../errorHelpers/AppError.js";
import status from "http-status";
import {
    CreateRoleDto,
    UpdateRoleDto,
    CreatePermissionDto,
    UpdateRolePermissionsDto,
    UpdateUserRolesDto,
    UpdateUserPoliciesDto,
    RoleQuery,
    PermissionQuery,
} from "./security.interface.js";
import { DEFAULT_PERMISSIONS, DEFAULT_ROLES } from "../../types/security.types.js";

// ─────────────────────────────────────────────────────────────────────────────
//  ROLES
// ─────────────────────────────────────────────────────────────────────────────

const getRoles = async (query: RoleQuery) => {
    const roles = await db.cnsWeb.role.findMany({
        where: query.search
            ? {
                  OR: [
                      { name: { contains: query.search } },
                      { label: { contains: query.search } },
                  ],
              }
            : undefined,
        include: {
            _count: {
                select: { permissions: true, userRoles: true },
            },
        },
        orderBy: { createdAt: "asc" },
    });

    return roles;
};

const getRole = async (id: string) => {
    const role = await db.cnsWeb.role.findUnique({
        where: { id },
        include: {
            permissions: {
                include: { permission: true },
                orderBy: [{ permission: { module: "asc" } }],
            },
            _count: { select: { userRoles: true } },
        },
    });

    if (!role) throw new AppError(status.NOT_FOUND, "Role not found.");
    return role;
};

const createRole = async (dto: CreateRoleDto, adminUserId: string) => {
    const existing = await db.cnsWeb.role.findUnique({ where: { name: dto.name.toUpperCase() } });
    if (existing) throw new AppError(status.CONFLICT, `Role '${dto.name}' already exists.`);

    const role = await db.cnsWeb.role.create({
        data: {
            name: dto.name.toUpperCase(),
            label: dto.label,
            description: dto.description,
        },
    });

    writeAuditLog({ userId: adminUserId, action: "SECURITY_ROLE_CREATE", entity: "Role", entityId: role.id, payload: dto as Record<string, unknown> });
    return role;
};

const updateRole = async (id: string, dto: UpdateRoleDto, adminUserId: string) => {
    const role = await getRole(id);
    if (role.isSystem && dto.label === undefined) {
        // allow label/description updates even for system roles
    }

    const updated = await db.cnsWeb.role.update({ where: { id }, data: dto });
    writeAuditLog({ userId: adminUserId, action: "SECURITY_ROLE_UPDATE", entity: "Role", entityId: id, payload: dto as Record<string, unknown> });
    return updated;
};

const deleteRole = async (id: string, adminUserId: string) => {
    const role = await getRole(id);
    if (role.isSystem) {
        throw new AppError(status.FORBIDDEN, "System roles cannot be deleted.");
    }

    // Invalidate cache for all users who have this role
    const userRoles = await db.cnsWeb.userRole.findMany({ where: { roleId: id }, select: { userId: true } });
    await db.cnsWeb.role.delete({ where: { id } });

    await Promise.all(userRoles.map((ur) => invalidateUserPermissionCache(ur.userId)));
    writeAuditLog({ userId: adminUserId, action: "SECURITY_ROLE_DELETE", entity: "Role", entityId: id });
};

// ─────────────────────────────────────────────────────────────────────────────
//  PERMISSIONS
// ─────────────────────────────────────────────────────────────────────────────

const getPermissions = async (query: PermissionQuery) => {
    const permissions = await db.cnsWeb.permission.findMany({
        where: {
            ...(query.module ? { module: query.module } : {}),
            ...(query.search
                ? {
                      OR: [
                          { module: { contains: query.search } },
                          { action: { contains: query.search } },
                          { label: { contains: query.search } },
                      ],
                  }
                : {}),
        },
        orderBy: [{ module: "asc" }, { action: "asc" }],
    });

    // Group by module for convenient UI consumption
    const grouped: Record<string, typeof permissions> = {};
    for (const perm of permissions) {
        if (!grouped[perm.module]) grouped[perm.module] = [];
        grouped[perm.module].push(perm);
    }

    return { flat: permissions, grouped };
};

const createPermission = async (dto: CreatePermissionDto, adminUserId: string) => {
    const existing = await db.cnsWeb.permission.findUnique({
        where: { module_action: { module: dto.module, action: dto.action } },
    });
    if (existing) throw new AppError(status.CONFLICT, `Permission '${dto.module}:${dto.action}' already exists.`);

    const perm = await db.cnsWeb.permission.create({ data: dto });
    writeAuditLog({ userId: adminUserId, action: "SECURITY_PERMISSION_CREATE", entity: "Permission", entityId: perm.id, payload: dto as Record<string, unknown> });
    return perm;
};

// ─────────────────────────────────────────────────────────────────────────────
//  ROLE PERMISSIONS (the permission matrix)
// ─────────────────────────────────────────────────────────────────────────────

const getRolePermissions = async (roleId: string) => {
    await getRole(roleId); // ensures role exists
    return db.cnsWeb.rolePermission.findMany({
        where: { roleId },
        include: { permission: true },
        orderBy: [{ permission: { module: "asc" } }, { permission: { action: "asc" } }],
    });
};

/**
 * Bulk-replace the entire permission matrix for a role.
 * Sends the complete desired state; we delete old and upsert new.
 */
const updateRolePermissions = async (
    roleId: string,
    dto: UpdateRolePermissionsDto,
    adminUserId: string
) => {
    const role = await getRole(roleId); // ensures role exists

    // Delete existing
    await db.cnsWeb.rolePermission.deleteMany({ where: { roleId } });

    // Insert new
    if (dto.permissions.length > 0) {
        await db.cnsWeb.rolePermission.createMany({
            data: dto.permissions.map((p) => ({
                roleId,
                permissionId: p.permissionId,
            })),
        });
    }

    // Invalidate cache for users assigned via UserRole join table
    const byJoinTable = await db.cnsWeb.userRole.findMany({ where: { roleId }, select: { userId: true } });

    // Also invalidate cache for users whose User.role string column matches this role's name
    const roleName = (role as { name?: string }).name ?? "";
    const byRoleColumn = roleName
        ? await db.cnsWeb.user.findMany({ where: { role: roleName }, select: { id: true } })
        : [];

    const allUserIds = new Set([
        ...byJoinTable.map((ur) => ur.userId),
        ...byRoleColumn.map((u) => u.id),
    ]);

    await Promise.all([...allUserIds].map((uid) => invalidateUserPermissionCache(uid)));

    writeAuditLog({
        userId: adminUserId,
        action: "SECURITY_ROLE_PERMISSIONS_UPDATE",
        entity: "Role",
        entityId: roleId,
        payload: dto as Record<string, unknown>,
    });

    return getRolePermissions(roleId);
};

// ─────────────────────────────────────────────────────────────────────────────
//  USER ROLES
// ─────────────────────────────────────────────────────────────────────────────

const getUserRoles = async (userId: string) => {
    return db.cnsWeb.userRole.findMany({
        where: { userId },
        include: {
            role: {
                include: { _count: { select: { permissions: true } } },
            },
        },
    });
};

/** Full replacement — sets exactly the provided roleIds */
const updateUserRoles = async (userId: string, dto: UpdateUserRolesDto, adminUserId: string) => {
    // Validate user exists
    const user = await db.cnsWeb.user.findUnique({ where: { id: userId, isDeleted: false } });
    if (!user) throw new AppError(status.NOT_FOUND, "User not found.");

    // Validate all roleIds exist
    const roles = await db.cnsWeb.role.findMany({ where: { id: { in: dto.roleIds } } });
    if (roles.length !== dto.roleIds.length) {
        throw new AppError(status.BAD_REQUEST, "One or more role IDs are invalid.");
    }

    // Replace
    await db.cnsWeb.userRole.deleteMany({ where: { userId } });
    if (dto.roleIds.length > 0) {
        await db.cnsWeb.userRole.createMany({
            data: dto.roleIds.map((roleId) => ({ userId, roleId })),
        });
    }

    await invalidateUserPermissionCache(userId);
    writeAuditLog({
        userId: adminUserId,
        action: "SECURITY_USER_ROLES_UPDATE",
        entity: "User",
        entityId: userId,
        payload: dto as Record<string, unknown>,
    });

    return getUserRoles(userId);
};

// ─────────────────────────────────────────────────────────────────────────────
//  USER POLICIES (per-user overrides)
// ─────────────────────────────────────────────────────────────────────────────

const getUserPolicies = async (userId: string) => {
    return db.cnsWeb.policy.findMany({
        where: { userId },
        include: { permission: true },
        orderBy: [{ permission: { module: "asc" } }, { permission: { action: "asc" } }],
    });
};

/** Full replacement for user's policy overrides */
const updateUserPolicies = async (
    userId: string,
    dto: UpdateUserPoliciesDto,
    adminUserId: string
) => {
    const user = await db.cnsWeb.user.findUnique({ where: { id: userId, isDeleted: false } });
    if (!user) throw new AppError(status.NOT_FOUND, "User not found.");

    await db.cnsWeb.policy.deleteMany({ where: { userId } });
    if (dto.policies.length > 0) {
        await db.cnsWeb.policy.createMany({
            data: dto.policies.map((p) => ({
                userId,
                permissionId: p.permissionId,
                effect: p.effect,
                reason: p.reason ?? null,
            })),
        });
    }


    await invalidateUserPermissionCache(userId);
    writeAuditLog({
        userId: adminUserId,
        action: "SECURITY_USER_POLICIES_UPDATE",
        entity: "User",
        entityId: userId,
        payload: dto as Record<string, unknown>,
    });

    return getUserPolicies(userId);
};

// ─────────────────────────────────────────────────────────────────────────────
//  SEED
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Idempotently seeds default roles and permissions.
 * Safe to call multiple times — uses upsert.
 */
const seedDefaults = async () => {
    for (const role of DEFAULT_ROLES) {
        await db.cnsWeb.role.upsert({
            where: { name: role.name },
            update: {},
            create: { name: role.name, label: role.label, isSystem: role.isSystem },
        });
    }

    for (const perm of DEFAULT_PERMISSIONS) {
        await db.cnsWeb.permission.upsert({
            where: { module_action: { module: perm.module, action: perm.action } },
            update: {},
            create: { module: perm.module, action: perm.action, label: perm.label },
        });
    }

    return { message: "Default roles and permissions seeded successfully." };
};

// ─────────────────────────────────────────────────────────────────────────────
//  MY PERMISSIONS
// ─────────────────────────────────────────────────────────────────────────────

const getMyPermissions = async (userId: string) => {
    return getUserPermissions(userId);
};

export const SecurityService = {
    // Roles
    getRoles,
    getRole,
    createRole,
    updateRole,
    deleteRole,
    // Permissions
    getPermissions,
    createPermission,
    // Role ↔ Permission matrix
    getRolePermissions,
    updateRolePermissions,
    // User ↔ Role
    getUserRoles,
    updateUserRoles,
    // User policies
    getUserPolicies,
    updateUserPolicies,
    // Seed
    seedDefaults,
    // My Permissions
    getMyPermissions,
};

