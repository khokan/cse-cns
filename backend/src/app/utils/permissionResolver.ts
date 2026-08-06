// src/app/utils/permissionResolver.ts
//
// Core RBAC resolution logic — pure, cache-friendly.
//
// Resolution order:
//   1. Load user's roles → RolePermissions (ALLOW)
//   2. Load user's Policies (per-user ALLOW/DENY overrides)
//   3. Merge: policy DENY always wins
//   4. Return { allowed, module, action }

import { db } from "../lib/prisma.js";
import { cacheGet, cacheSet, cacheDel } from "../lib/redis.js";
import { PermissionResult } from "../types/security.types.js";

const CACHE_TTL = 300; // 5 minutes

/** Cache key for a user's resolved permission blob */
const cacheKey = (userId: string) => `perm:${userId}`;

interface CachedPermissions {
    [moduleAction: string]: "ALLOW" | "DENY";
}

/**
 * Loads and caches the full permission map for a user.
 * Key format: "module:action" → "ALLOW" | "DENY"
 *
 * Resolution rules:
 *  - Aggregate all role-level ALLOW
 *  - Apply user policy overrides last (DENY wins unconditionally)
 */
async function loadUserPermissions(userId: string): Promise<CachedPermissions> {
    // Try Redis first
    const cached = await cacheGet<CachedPermissions>(cacheKey(userId));
    if (cached) return cached;

    const permMap: CachedPermissions = {};

    // 1a. Load from UserRole join table
    const userRoles = await db.cnsWeb.userRole.findMany({
        where: { userId },
        include: {
            role: {
                include: {
                    permissions: {
                        include: { permission: true },
                    },
                },
            },
        },
    });

    for (const ur of userRoles) {
        for (const rp of ur.role.permissions) {
            const key = `${rp.permission.module}:${rp.permission.action}`;
            permMap[key] = "ALLOW";
        }
    }

    // 1b. Per-user policy overrides — DENY wins unconditionally
    const policies = await db.cnsWeb.policy.findMany({
        where: { userId },
        include: { permission: true },
    });

    for (const policy of policies) {
        const key = `${policy.permission.module}:${policy.permission.action}`;
        permMap[key] = policy.effect as "ALLOW" | "DENY";
    }

    // Cache the resolved map
    await cacheSet(cacheKey(userId), permMap, CACHE_TTL);

    return permMap;
}


export async function getUserPermissions(userId: string): Promise<Record<string, "ALLOW" | "DENY">> {
    return loadUserPermissions(userId);
}

/**
 * Resolve whether a user has a specific permission.
 *
 * @param userId  - The authenticated user's ID
 * @param module  - Permission module (e.g. "invoice")
 * @param action  - CRUD action (e.g. "create")
 * @returns       - { allowed, module, action }
 */
export async function resolvePermission(
    userId: string,
    module: string,
    action: string
): Promise<PermissionResult> {
    const permMap = await loadUserPermissions(userId);
    const key = `${module}:${action}`;
    const effect = permMap[key];

    if (!effect || effect === "DENY") {
        return { allowed: false, module, action };
    }

    return { allowed: true, module, action };
}


/**
 * Invalidate the cached permissions for a user.
 * Call this whenever UserRole or Policy records change for a user.
 */
export async function invalidateUserPermissionCache(userId: string): Promise<void> {
    await cacheDel(cacheKey(userId));
}

