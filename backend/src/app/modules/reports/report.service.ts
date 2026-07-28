import { v4 as uuidv4 } from "uuid";
import { db } from "../../lib/prisma.js";
import { enqueueReportJob } from "../../queues/report.queue.js";
import { processReportJob } from "../../workers/report.worker.js";
import { storageLib } from "../../lib/storage.js";
import AppError from "../../errorHelpers/AppError.js";
import status from "http-status";
import type {
    CreateReportJobDto,
    ReportJobQuery,
} from "./report.interface.js";

const MAX_ACTIVE_JOBS_PER_USER = 5;

// ---------------------------------------------------------------------------
// requestReport — validates, creates DB record, enqueues the job
// ---------------------------------------------------------------------------
const requestReport = async (
    userId: string,
    dto: CreateReportJobDto
) => {
    // Rate-limit: cap active jobs per user
    const activeCount = await db.cnsWeb.reportJob.count({
        where: {
            userId,
            status: { in: ["PENDING", "PROCESSING"] },
        },
    });

    if (activeCount >= MAX_ACTIVE_JOBS_PER_USER) {
        throw new AppError(
            status.TOO_MANY_REQUESTS,
            `You already have ${activeCount} active report job(s). Please wait for them to complete before requesting more.`
        );
    }

    const queueJobId = uuidv4();

    // Create DB record
    const reportJob = await db.cnsWeb.reportJob.create({
        data: {
            userId,
            reportType: dto.reportType,
            format: dto.format,
            filters: dto.filters ? JSON.stringify(dto.filters) : null,
            status: "PENDING",
            queueJobId,
        },
    });

    // Enqueue the background job
    enqueueReportJob(async () => {
        await processReportJob({
            reportJobId: reportJob.id,
            userId,
            reportType: dto.reportType,
            format: dto.format,
            filters: dto.filters ?? {},
        });
    });

    return {
        jobId: reportJob.id,
        queueJobId,
        status: "PENDING",
        reportType: dto.reportType,
        format: dto.format,
        requestedAt: reportJob.requestedAt,
        estimatedWait: 10, // seconds — rough estimate
    };
};

// ---------------------------------------------------------------------------
// getJobs — paginated list, scoped to user (or all for ADMIN/IT)
// ---------------------------------------------------------------------------
const getJobs = async (
    userId: string,
    userRole: string,
    query: ReportJobQuery
) => {
    const page = parseInt(query.page ?? "1", 10);
    const limit = parseInt(query.limit ?? "10", 10);
    const skip = (page - 1) * limit;

    const canViewAll =
        (query.all === "true") && ["ADMIN", "IT"].includes(userRole);

    const where = {
        ...(canViewAll ? {} : { userId }),
        ...(query.status ? { status: query.status } : {}),
        ...(query.reportType ? { reportType: query.reportType } : {}),
        ...(query.format ? { format: query.format } : {}),
    };

    const [jobs, total] = await Promise.all([
        db.cnsWeb.reportJob.findMany({
            where,
            orderBy: { requestedAt: "desc" },
            skip,
            take: limit,
            include: {
                user: { select: { name: true, email: true } },
            },
        }),
        db.cnsWeb.reportJob.count({ where }),
    ]);

    return {
        data: jobs,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

// ---------------------------------------------------------------------------
// getJob — single job, scoped ownership check
// ---------------------------------------------------------------------------
const getJob = async (jobId: string, userId: string, userRole: string) => {
    const job = await db.cnsWeb.reportJob.findUnique({
        where: { id: jobId },
        include: { user: { select: { name: true, email: true } } },
    });

    if (!job) {
        throw new AppError(status.NOT_FOUND, "Report job not found.");
    }

    const canAccess =
        job.userId === userId || ["ADMIN", "IT"].includes(userRole);

    if (!canAccess) {
        throw new AppError(
            status.FORBIDDEN,
            "You don't have permission to view this report job."
        );
    }

    return job;
};

// ---------------------------------------------------------------------------
// cancelJob — marks PENDING jobs as CANCELLED
// ---------------------------------------------------------------------------
const cancelJob = async (
    jobId: string,
    userId: string,
    userRole: string
) => {
    const job = await getJob(jobId, userId, userRole);

    if (!["PENDING", "PROCESSING"].includes(job.status)) {
        throw new AppError(
            status.BAD_REQUEST,
            `Cannot cancel a job with status "${job.status}". Only PENDING or PROCESSING jobs can be cancelled.`
        );
    }

    const updated = await db.cnsWeb.reportJob.update({
        where: { id: jobId },
        data: { status: "CANCELLED", completedAt: new Date() },
    });

    // If file was already written (PROCESSING reached disk step), clean it up
    if (updated.filePath) {
        await storageLib.deleteReport(updated.filePath);
    }

    return updated;
};

// ---------------------------------------------------------------------------
// getJobForDownload — validates ownership + file readiness
// ---------------------------------------------------------------------------
const getJobForDownload = async (
    jobId: string,
    userId: string,
    userRole: string
) => {
    const job = await getJob(jobId, userId, userRole);

    if (job.status !== "COMPLETED" || !job.filePath) {
        throw new AppError(
            status.BAD_REQUEST,
            "Report is not ready for download. Please wait until the job is COMPLETED."
        );
    }

    const exists = await storageLib.reportExists(job.filePath);
    if (!exists) {
        throw new AppError(
            status.NOT_FOUND,
            "Report file not found on disk. It may have been cleaned up."
        );
    }

    return job;
};

export const ReportService = {
    requestReport,
    getJobs,
    getJob,
    cancelJob,
    getJobForDownload,
};
