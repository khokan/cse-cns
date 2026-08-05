"use client";

import { apiFetch, type ApiResult } from "@/lib/api-client";
import type {
  Role,
  Permission,
  RolePermission,
  UserRole,
  Policy,
  PermissionsGrouped,
  CreateRoleDto,
  UpdateRoleDto,
  UpdateRolePermissionsDto,
  UpdateUserRolesDto,
  UpdateUserPoliciesDto,
} from "@/types/security.types";

// ─── Roles ────────────────────────────────────────────────────────────────────

export const getRoles = async (
  search?: string
): Promise<ApiResult<{ data: Role[] }>> =>
  apiFetch(`/security/roles${search ? `?search=${encodeURIComponent(search)}` : ""}`);

export const getRole = async (
  id: string
): Promise<ApiResult<{ data: Role & { permissions: RolePermission[] } }>> =>
  apiFetch(`/security/roles/${id}`);

export const createRole = async (
  dto: CreateRoleDto
): Promise<ApiResult<{ data: Role }>> =>
  apiFetch("/security/roles", {
    method: "POST",
    body: JSON.stringify(dto),
  });

export const updateRole = async (
  id: string,
  dto: UpdateRoleDto
): Promise<ApiResult<{ data: Role }>> =>
  apiFetch(`/security/roles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });

export const deleteRole = async (
  id: string
): Promise<ApiResult<unknown>> =>
  apiFetch(`/security/roles/${id}`, { method: "DELETE" });

// ─── Permissions ──────────────────────────────────────────────────────────────

export const getPermissions = async (
  params?: { module?: string; search?: string }
): Promise<ApiResult<{ data: PermissionsGrouped }>> => {
  const qs = new URLSearchParams();
  if (params?.module) qs.set("module", params.module);
  if (params?.search) qs.set("search", params.search);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/security/permissions${query}`);
};

// ─── Role ↔ Permission matrix ─────────────────────────────────────────────────

export const getRolePermissions = async (
  roleId: string
): Promise<ApiResult<{ data: RolePermission[] }>> =>
  apiFetch(`/security/roles/${roleId}/permissions`);

export const updateRolePermissions = async (
  roleId: string,
  dto: UpdateRolePermissionsDto
): Promise<ApiResult<{ data: RolePermission[] }>> =>
  apiFetch(`/security/roles/${roleId}/permissions`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });

// ─── User ↔ Role ──────────────────────────────────────────────────────────────

export const getUserRoles = async (
  userId: string
): Promise<ApiResult<{ data: UserRole[] }>> =>
  apiFetch(`/security/users/${userId}/roles`);

export const updateUserRoles = async (
  userId: string,
  dto: UpdateUserRolesDto
): Promise<ApiResult<{ data: UserRole[] }>> =>
  apiFetch(`/security/users/${userId}/roles`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });

// ─── User policies ────────────────────────────────────────────────────────────

export const getUserPolicies = async (
  userId: string
): Promise<ApiResult<{ data: Policy[] }>> =>
  apiFetch(`/security/users/${userId}/policies`);

export const updateUserPolicies = async (
  userId: string,
  dto: UpdateUserPoliciesDto
): Promise<ApiResult<{ data: Policy[] }>> =>
  apiFetch(`/security/users/${userId}/policies`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });

// ─── Seed ─────────────────────────────────────────────────────────────────────

export const seedDefaults = async (): Promise<ApiResult<unknown>> =>
  apiFetch("/security/seed", { method: "POST" });

// ─── My Permissions ───────────────────────────────────────────────────────────

export const getMyPermissions = async (): Promise<ApiResult<{ data: Record<string, "ALLOW" | "DENY"> }>> =>
  apiFetch("/security/my-permissions");

