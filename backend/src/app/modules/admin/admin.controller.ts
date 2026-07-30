import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { AdminService } from "./admin.service.js";
import status from "http-status";

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
    const { id } = req.params;
    const result = await AdminService.getUser(id as string);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User details fetched successfully.",
        data: result,
    });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminUserId = req.user!.userId;
    const dto = req.body;

    const result = await AdminService.updateUser(id as string, dto, adminUserId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User updated successfully.",
        data: result,
    });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminUserId = req.user!.userId;

    const result = await AdminService.deleteUser(id as string, adminUserId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User deleted successfully.",
        data: result,
    });
});

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
    updateUser,
    deleteUser,
    getDashboardStats,
    getAuditLogs,
};
