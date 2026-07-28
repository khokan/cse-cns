import { Request, Response } from "express";
import path from "path";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { ReportService } from "./report.service.js";
import { storageLib } from "../../lib/storage.js";
import AppError from "../../errorHelpers/AppError.js";
import status from "http-status";
import type { CreateReportJobDto, ReportJobQuery } from "./report.interface.js";

// MIME types for Content-Type header
const MIME_MAP: Record<string, string> = {
    pdf: "application/pdf",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    csv: "text/csv",
};

// ---------------------------------------------------------------------------
// POST /api/v1/reports/request
// ---------------------------------------------------------------------------
const requestReport = catchAsync(async (req: Request, res: Response) => {
    const dto = req.body as CreateReportJobDto;
    const userId = req.user!.userId;

    const result = await ReportService.requestReport(userId, dto);

    sendResponse(res, {
        httpStatusCode: status.ACCEPTED,
        success: true,
        message: "Report generation queued successfully.",
        data: result,
    });
});

// ---------------------------------------------------------------------------
// GET /api/v1/reports/jobs
// ---------------------------------------------------------------------------
const getJobs = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const query = req.query as ReportJobQuery;

    const { data, meta } = await ReportService.getJobs(userId, userRole, query);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Report jobs fetched successfully.",
        data,
        meta,
    });
});

// ---------------------------------------------------------------------------
// GET /api/v1/reports/jobs/:id
// ---------------------------------------------------------------------------
const getJob = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const job = await ReportService.getJob(id, userId, userRole);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Report job fetched successfully.",
        data: job,
    });
});

// ---------------------------------------------------------------------------
// GET /api/v1/reports/download/:id
// Streams the file directly to the browser as an attachment.
// ---------------------------------------------------------------------------
const downloadReport = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const job = await ReportService.getJobForDownload(id, userId, userRole);

    const ext = path.extname(job.filePath!).replace(".", "").toLowerCase();
    const mimeType = MIME_MAP[ext] ?? "application/octet-stream";
    const downloadName = job.fileName ?? `report_${id}.${ext}`;

    res.setHeader("Content-Type", mimeType);
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${downloadName}"`
    );
    if (job.fileSize) {
        res.setHeader("Content-Length", job.fileSize);
    }

    const stream = storageLib.createReportStream(job.filePath!);

    stream.on("error", (err) => {
        console.error("[Download] Stream error:", err);
        if (!res.headersSent) {
            throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to stream report file.");
        }
    });

    stream.pipe(res);
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/reports/jobs/:id  (cancel)
// ---------------------------------------------------------------------------
const cancelJob = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const job = await ReportService.cancelJob(id, userId, userRole);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Report job cancelled successfully.",
        data: job,
    });
});

export const ReportController = {
    requestReport,
    getJobs,
    getJob,
    downloadReport,
    cancelJob,
};
