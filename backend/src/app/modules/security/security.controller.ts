// src/app/modules/security/security.controller.ts

import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { SecurityService } from "./security.service.js";
import { RoleQuery, PermissionQuery } from "./security.interface.js";
import status from "http-status";

// ─── Roles ────────────────────────────────────────────────────────────────────

const getRoles = catchAsync(async (req: Request, res: Response) => {
    const result = await SecurityService.getRoles(req.query as unknown as RoleQuery);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Roles fetched successfully.", data: result });
});

const getRole = catchAsync(async (req: Request, res: Response) => {
    const result = await SecurityService.getRole(req.params.id as string);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Role fetched successfully.", data: result });
});

const createRole = catchAsync(async (req: Request, res: Response) => {
    const result = await SecurityService.createRole(req.body, req.user!.userId);
    sendResponse(res, { httpStatusCode: status.CREATED, success: true, message: "Role created successfully.", data: result });
});

const updateRole = catchAsync(async (req: Request, res: Response) => {
    const result = await SecurityService.updateRole(req.params.id as string, req.body, req.user!.userId);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Role updated successfully.", data: result });
});

const deleteRole = catchAsync(async (req: Request, res: Response) => {
    await SecurityService.deleteRole(req.params.id as string, req.user!.userId);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Role deleted successfully.", data: null });
});

// ─── Permissions ──────────────────────────────────────────────────────────────

const getPermissions = catchAsync(async (req: Request, res: Response) => {
    const result = await SecurityService.getPermissions(req.query as unknown as PermissionQuery);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Permissions fetched successfully.", data: result });
});

const createPermission = catchAsync(async (req: Request, res: Response) => {
    const result = await SecurityService.createPermission(req.body, req.user!.userId);
    sendResponse(res, { httpStatusCode: status.CREATED, success: true, message: "Permission created successfully.", data: result });
});

// ─── Role ↔ Permission Matrix ─────────────────────────────────────────────────

const getRolePermissions = catchAsync(async (req: Request, res: Response) => {
    const result = await SecurityService.getRolePermissions(req.params.id as string);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Role permissions fetched successfully.", data: result });
});

const updateRolePermissions = catchAsync(async (req: Request, res: Response) => {
    const result = await SecurityService.updateRolePermissions(req.params.id as string, req.body, req.user!.userId);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Role permissions updated successfully.", data: result });
});

// ─── User ↔ Role ──────────────────────────────────────────────────────────────

const getUserRoles = catchAsync(async (req: Request, res: Response) => {
    const result = await SecurityService.getUserRoles(req.params.userId as string);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: "User roles fetched successfully.", data: result });
});

const updateUserRoles = catchAsync(async (req: Request, res: Response) => {
    const result = await SecurityService.updateUserRoles(req.params.userId as string, req.body, req.user!.userId);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: "User roles updated successfully.", data: result });
});

// ─── User Policies ────────────────────────────────────────────────────────────

const getUserPolicies = catchAsync(async (req: Request, res: Response) => {
    const result = await SecurityService.getUserPolicies(req.params.userId as string);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: "User policies fetched successfully.", data: result });
});

const updateUserPolicies = catchAsync(async (req: Request, res: Response) => {
    const result = await SecurityService.updateUserPolicies(req.params.userId as string, req.body, req.user!.userId);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: "User policies updated successfully.", data: result });
});

// ─── Seed ─────────────────────────────────────────────────────────────────────

const seedDefaults = catchAsync(async (_req: Request, res: Response) => {
    const result = await SecurityService.seedDefaults();
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: result.message, data: null });
});

// ─── My Permissions ───────────────────────────────────────────────────────────

const getMyPermissions = catchAsync(async (req: Request, res: Response) => {
    const result = await SecurityService.getMyPermissions(req.user!.userId);
    sendResponse(res, { httpStatusCode: status.OK, success: true, message: "User permissions fetched successfully.", data: result });
});

export const SecurityController = {
    getRoles,
    getRole,
    createRole,
    updateRole,
    deleteRole,
    getPermissions,
    createPermission,
    getRolePermissions,
    updateRolePermissions,
    getUserRoles,
    updateUserRoles,
    getUserPolicies,
    updateUserPolicies,
    seedDefaults,
    getMyPermissions,
};


