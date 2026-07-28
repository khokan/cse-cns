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
    ReportType,
    ReportStatus,
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
    const filters = dto.filters ?? {};

    // -----------------------------------------------------------------------
    // BULK GENERATION FOR ADMIN
    // Admin clicks single button to generate tax certificates for ALL members in Member table
    // -----------------------------------------------------------------------
    if (filters.isBulk && dto.reportType === "trec_holder_tax_certificate") {
        const members = await db.cnsWeb.member.findMany({
            select: { MemberID: true, MemberCode: true, EmailAddress: true, MemberName: true },
        });

        if (members.length === 0) {
            throw new AppError(status.NOT_FOUND, "No members found in the Member table.");
        }

        // Map member EmailAddress or trecHolderId -> User id
        const users = await db.cnsWeb.user.findMany({
            select: { id: true, email: true, trecHolderId: true },
        });

        const emailToUserIdMap = new Map<string, string>();
        const trecIdToUserIdMap = new Map<string, string>();
        for (const u of users) {
            if (u.email) emailToUserIdMap.set(u.email.toLowerCase().trim(), u.id);
            if (u.trecHolderId) trecIdToUserIdMap.set(u.trecHolderId.trim(), u.id);
        }

        let createdCount = 0;

        for (const m of members) {
            const memberId = m.MemberCode || m.MemberID;
            if (!memberId) continue;

            const targetUserId =
                trecIdToUserIdMap.get(memberId) ||
                (m.EmailAddress && emailToUserIdMap.get(m.EmailAddress.toLowerCase().trim())) ||
                userId;

            const bQueueJobId = uuidv4();
            const memberFilters = {
                fiscalYear: filters.fiscalYear,
                trecHolderId: memberId,
                memberCode: m.MemberCode,
            };

            const reportJob = await db.cnsWeb.reportJob.create({
                data: {
                    userId: targetUserId,
                    reportType: dto.reportType,
                    format: dto.format,
                    filters: JSON.stringify(memberFilters),
                    status: "PENDING",
                    queueJobId: bQueueJobId,
                },
            });

            enqueueReportJob(async () => {
                await processReportJob({
                    reportJobId: reportJob.id,
                    userId: targetUserId,
                    reportType: dto.reportType,
                    format: dto.format,
                    filters: memberFilters,
                });
            });

            createdCount++;
        }

        return {
            jobId: "bulk-batch",
            queueJobId: "bulk-batch",
            status: "PENDING",
            reportType: dto.reportType,
            format: dto.format,
            requestedAt: new Date(),
            estimatedWait: 30,
            message: `Successfully enqueued ${createdCount} report jobs for all members in the Member table.`,
        };
    }

    // Single report job request — if trecHolderId is missing, resolve MemberID / trecHolderId for logged-in TRECHOLDER
    if (dto.reportType === "trec_holder_tax_certificate" && !filters.trecHolderId) {
        const user = await db.cnsWeb.user.findUnique({ where: { id: userId } });
        if (user?.trecHolderId) {
            filters.trecHolderId = user.trecHolderId;
        } else if (user?.email) {
            const member = await db.cnsWeb.member.findFirst({
                where: { EmailAddress: user.email },
            });
            filters.trecHolderId = member?.MemberID || member?.MemberCode || userId;
        } else {
            filters.trecHolderId = userId;
        }
    }

    // Verify user exists before creating report job
    const requestingUser = await db.cnsWeb.user.findUnique({
        where: { id: userId },
        select: { id: true, trecHolderId: true },
    });
    if (!requestingUser) {
        throw new AppError(status.UNAUTHORIZED, "User account not found. Please log in again.");
    }

    // Target userId for job: if trecHolderId is specified (e.g. by admin), attempt matching to user account
    let jobTargetUserId = userId;
    if (filters.trecHolderId) {
        const targetUser = await db.cnsWeb.user.findFirst({
            where: {
                OR: [
                    { trecHolderId: filters.trecHolderId.trim() },
                    { email: filters.trecHolderId.trim() },
                ],
            },
            select: { id: true },
        });
        if (targetUser) {
            jobTargetUserId = targetUser.id;
        }
    }

    // Create DB record
    const reportJob = await db.cnsWeb.reportJob.create({
        data: {
            userId: jobTargetUserId,
            reportType: dto.reportType,
            format: dto.format,
            filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : null,
            status: "PENDING",
            queueJobId,
        },
    });

    // Enqueue the background job
    enqueueReportJob(async () => {
        await processReportJob({
            reportJobId: reportJob.id,
            userId: jobTargetUserId,
            reportType: dto.reportType,
            format: dto.format,
            filters,
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
// Matches by userId OR trecHolderId found in filters JSON column!
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

    const currentUser = await db.cnsWeb.user.findUnique({
        where: { id: userId },
        select: { trecHolderId: true },
    });
    const userTrecId = currentUser?.trecHolderId?.trim();

    const userScopedWhere = userTrecId
        ? {
              OR: [
                  { userId },
                  { filters: { contains: `"${userTrecId}"` } },
              ],
          }
        : { userId };

    const where = {
        ...(canViewAll ? {} : userScopedWhere),
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

    const currentUser = await db.cnsWeb.user.findUnique({
        where: { id: userId },
        select: { trecHolderId: true },
    });
    const userTrecId = currentUser?.trecHolderId?.trim();
    const canAccess =
        job.userId === userId ||
        ["ADMIN", "IT"].includes(userRole) ||
        (Boolean(userTrecId) && Boolean(job.filters?.includes(userTrecId!)));

    if (!canAccess) {
        throw new AppError(
            status.FORBIDDEN,
            "You don't have permission to view this report job."
        );
    }

    return job;
};

// ---------------------------------------------------------------------------
// cancelJob — TRECHOLDER can cancel their OWN pending/processing job
// ---------------------------------------------------------------------------
const cancelJob = async (
    jobId: string,
    userId: string,
    userRole: string
) => {
    const job = await getJob(jobId, userId, userRole);

    if (job.userId !== userId && !["ADMIN", "IT"].includes(userRole)) {
        throw new AppError(
            status.FORBIDDEN,
            "You can only cancel your own report jobs."
        );
    }

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

    if (updated.filePath) {
        await storageLib.deleteReport(updated.filePath);
    }

    return updated;
};

// ---------------------------------------------------------------------------
// deleteJob — ADMIN/IT can delete any report job and purge its file
// TRECHOLDER calling delete will trigger cancelJob for pending/processing jobs
// ---------------------------------------------------------------------------
const deleteJob = async (
    jobId: string,
    userId: string,
    userRole: string
) => {
    const job = await getJob(jobId, userId, userRole);

    const isAdminOrIT = ["ADMIN", "IT"].includes(userRole);

    if (isAdminOrIT) {
        // ADMIN can delete ANY report job permanently (and remove file from disk)
        if (job.filePath) {
            await storageLib.deleteReport(job.filePath);
        }
        const deleted = await db.cnsWeb.reportJob.delete({
            where: { id: jobId },
        });
        return deleted;
    }

    // Non-admin (TRECHOLDER) attempts cancel instead
    return cancelJob(jobId, userId, userRole);
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

// ---------------------------------------------------------------------------
// deleteAllJobs — ADMIN bulk deletion of all report jobs matching filter
// Deletes files from disk storage and purges DB records
// ---------------------------------------------------------------------------
const deleteAllJobs = async (
    userId: string,
    userRole: string,
    reportType?: string,
    statusFilter?: string
) => {
    if (!["ADMIN", "IT"].includes(userRole)) {
        throw new AppError(status.FORBIDDEN, "Only administrators can perform bulk report deletion.");
    }

    const where = {
        ...(reportType ? { reportType: reportType as ReportType } : {}),
        ...(statusFilter && statusFilter !== "ALL" ? { status: statusFilter as ReportStatus } : {}),
    };

    // 1. Fetch matching jobs to clean up files on disk
    const jobs = await db.cnsWeb.reportJob.findMany({
        where,
        select: { id: true, filePath: true },
    });

    // 2. Delete all files from storage disk
    for (const job of jobs) {
        if (job.filePath) {
            await storageLib.deleteReport(job.filePath);
        }
    }

    // 3. Purge DB records in bulk
    const result = await db.cnsWeb.reportJob.deleteMany({ where });

    return {
        count: result.count,
    };
};

export const ReportService = {
    requestReport,
    getJobs,
    getJob,
    cancelJob,
    deleteJob,
    deleteAllJobs,
    getJobForDownload,
};
