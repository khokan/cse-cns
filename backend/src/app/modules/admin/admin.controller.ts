import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { AdminService } from "./admin.service.js";
import status from "http-status";

// ─── Read ──────────────────────────────────────────────────────────────────────

const getUsers = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const result = await AdminService.getUsers(query);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Users fetched successfully.",
        data: result.data,
        meta: result.meta,
    });
});

const getUser = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await AdminService.getUser(id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User details fetched successfully.",
        data: result,
    });
});

// ─── Create ────────────────────────────────────────────────────────────────────

const createUser = catchAsync(async (req: Request, res: Response) => {
    const actorId = req.user!.userId;
    const result = await AdminService.createUser(req.body, actorId);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "User created successfully.",
        data: result,
    });
});

// ─── Update (profile fields) ───────────────────────────────────────────────────

const updateUser = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const actorId = req.user!.userId;
    const result = await AdminService.updateUser(id, req.body, actorId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User updated successfully.",
        data: result,
    });
});

// ─── Update role (ADMIN only) ──────────────────────────────────────────────────

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const actorId = req.user!.userId;
    const result = await AdminService.updateUserRole(id, req.body, actorId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User role updated successfully.",
        data: result,
    });
});

// ─── Toggle status (ADMIN + ACCOUNTING) ───────────────────────────────────────

const toggleStatus = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const actorId = req.user!.userId;
    const result = await AdminService.toggleUserStatus(id, req.body, actorId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: `User ${req.body.status === "ACTIVE" ? "activated" : "deactivated"} successfully.`,
        data: result,
    });
});

// ─── Delete ────────────────────────────────────────────────────────────────────

const deleteUser = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const actorId = req.user!.userId;
    const result = await AdminService.deleteUser(id, actorId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User deleted successfully.",
        data: result,
    });
});

// ─── Dashboard & audit logs ────────────────────────────────────────────────────

const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
    const result = await AdminService.getDashboardStats();

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Dashboard stats fetched successfully.",
        data: result,
    });
});

const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const result = await AdminService.getAuditLogs(query);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Audit logs fetched successfully.",
        data: result.data,
        meta: result.meta,
    });
});

export const AdminController = {
    getUsers,
    getUser,
    createUser,
    updateUser,
    updateUserRole,
    toggleStatus,
    deleteUser,
    getDashboardStats,
    getAuditLogs,
};
