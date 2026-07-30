import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { DatatableService } from "./datatable.service.js";
import type { DatatableQuery } from "./datatable.interface.js";
import status from "http-status";

const getAccessibleTables = catchAsync(async (req: Request, res: Response) => {
    const userRole = req.user!.role as any;
    const result = DatatableService.getAccessibleTables(userRole);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Accessible data tables fetched successfully.",
        data: result,
    });
});

const listRows = catchAsync(async (req: Request, res: Response) => {
    const { table } = req.params;
    const userRole = req.user!.role as any;
    const query = req.query as unknown as DatatableQuery;

    const result = await DatatableService.listRows(table as string, query, userRole);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: `Rows fetched successfully for table '${table}'.`,
        data: result.data,
        meta: result.meta,
    });
});

const getRow = catchAsync(async (req: Request, res: Response) => {
    const { table, id } = req.params;
    const userRole = req.user!.role as any;

    const result = await DatatableService.getRow(table as string, id as string, userRole);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: `Record '${id}' fetched successfully from '${table}'.`,
        data: result,
    });
});

const createRow = catchAsync(async (req: Request, res: Response) => {
    const { table } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role as any;
    const data = req.body;

    const result = await DatatableService.createRow(table as string, data, userId, userRole);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: `Record created successfully in '${table}'.`,
        data: result,
    });
});

const updateRow = catchAsync(async (req: Request, res: Response) => {
    const { table, id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role as any;
    const data = req.body;

    const result = await DatatableService.updateRow(table as string, id as string, data, userId, userRole);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: `Record '${id}' updated successfully in '${table}'.`,
        data: result,
    });
});

const deleteRow = catchAsync(async (req: Request, res: Response) => {
    const { table, id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role as any;

    const result = await DatatableService.deleteRow(table as string, id as string, userId, userRole);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: `Record '${id}' deleted successfully from '${table}'.`,
        data: result,
    });
});

export const DatatableController = {
    getAccessibleTables,
    listRows,
    getRow,
    createRow,
    updateRow,
    deleteRow,
};
