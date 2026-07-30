import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { SettlementService } from "./settlement.service.js";
import status from "http-status";

const triggerSettlement = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const dto = req.body;

    const result = await SettlementService.triggerSettlement(userId, userRole, dto);

    sendResponse(res, {
        httpStatusCode: status.ACCEPTED,
        success: true,
        message: "Settlement process triggered successfully.",
        data: result,
    });
});

const getSettlements = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const result = await SettlementService.getSettlements(query);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Settlement records fetched successfully.",
        data: result.data,
        meta: result.meta,
    });
});

const getSettlementByContractNumber = catchAsync(async (req: Request, res: Response) => {
    const { contractNumber } = req.params;
    const result = await SettlementService.getSettlementByContractNumber(contractNumber as string);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Settlement record fetched successfully.",
        data: result,
    });
});

const retrySettlement = catchAsync(async (req: Request, res: Response) => {
    const { contractNumber } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const result = await SettlementService.retrySettlement(contractNumber as string, userId, userRole);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Settlement job retried successfully.",
        data: result,
    });
});

export const SettlementController = {
    triggerSettlement,
    getSettlements,
    getSettlementByContractNumber,
    retrySettlement,
};
