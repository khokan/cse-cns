import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { TaxToNBRService } from "./taxToNBR.service.js";
import status from "http-status";

const getAllTaxToNBRs = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const result = await TaxToNBRService.getAllTaxToNBRs(query as any);
    
    // Debug logging - Check for any remaining Decimal objects
    // if (result.data && Array.isArray(result.data)) {
    //     console.log("=== DEBUG: getAllTaxToNBRs Response ===");
    //     console.log("First record structure:", result.data[0]);
    //     if (result.data[0]) {
    //         const firstRecord = result.data[0] as any;
    //         console.log("cseCommission type:", typeof firstRecord.cseCommission);
    //         console.log("cseCommission value:", firstRecord.cseCommission);
    //         console.log("cseCommission constructor:", firstRecord.cseCommission?.constructor?.name);
    //         console.log("tradeVolume type:", typeof firstRecord.tradeVolume);
    //         console.log("tradeVolume value:", firstRecord.tradeVolume);
    //         console.log("paymentAmount type:", typeof firstRecord.paymentAmount);
    //         console.log("paymentAmount value:", firstRecord.paymentAmount);
    //     }
    // }
    
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Tax to NBR records fetched successfully.",
        data: result.data,
        meta: result.meta,
    });
});

const getTaxToNBRById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await TaxToNBRService.getTaxToNBRById(BigInt(id as string));

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Tax to NBR record fetched successfully.",
        data: result,
    });
});

const createTaxToNBR = catchAsync(async (req: Request, res: Response) => {
    const dto = req.body;
    const result = await TaxToNBRService.createTaxToNBR(dto);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Tax to NBR record created successfully.",
        data: result,
    });
});

const updateTaxToNBR = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dto = req.body;
    const result = await TaxToNBRService.updateTaxToNBR(BigInt(id as string), dto);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Tax to NBR record updated successfully.",
        data: result,
    });
});

const deleteTaxToNBR = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await TaxToNBRService.deleteTaxToNBR(BigInt(id as string));

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Tax to NBR record deleted successfully.",
        data: result,
    });
});

export const TaxToNBRController = {
    getAllTaxToNBRs,
    getTaxToNBRById,
    createTaxToNBR,
    updateTaxToNBR,
    deleteTaxToNBR,
};
