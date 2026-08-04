import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { ChallanService } from "./challan.service.js";
import status from "http-status";

const getAllChallans = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const result = await ChallanService.getAllChallans(query as any);
    
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Challans fetched successfully.",
        data: result.data,
        meta: result.meta,
    });
});

const getChallanById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ChallanService.getChallanById(Number(id));

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Challan fetched successfully.",
        data: result,
    });
});

const createChallan = catchAsync(async (req: Request, res: Response) => {
    const dto = req.body;
    const result = await ChallanService.createChallan(dto);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Challan created successfully.",
        data: result,
    });
});

const updateChallan = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dto = req.body;
    const result = await ChallanService.updateChallan(Number(id), dto);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Challan updated successfully.",
        data: result,
    });
});

const deleteChallan = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ChallanService.deleteChallan(Number(id));

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Challan deleted successfully.",
        data: result,
    });
});

export const ChallanController = {
    getAllChallans,
    getChallanById,
    createChallan,
    updateChallan,
    deleteChallan,
};
