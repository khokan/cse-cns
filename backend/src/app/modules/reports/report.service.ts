import { v4 as uuidv4 } from "uuid";
import { db } from "../../lib/prisma.js";
import { enqueueReportJob } from "../../queues/report.queue.js";
import { storageLib } from "../../lib/storage.js";
import { reportCache } from "../../lib/redis.js";
import { writeAuditLog } from "../../utils/auditLog.js";
import AppError from "../../errorHelpers/AppError.js";
import status from "http-status";
import type {
    CreateReportJobDto,
    ReportJobQuery,
    ReportType,
    ReportStatus,
} from "./report.interface.js";

const MAX_ACTIVE_JOBS_PER_USER = 5;

const requestReport = async (
    userId: string,
    dto: CreateReportJobDto
) => {
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

    const selectedMemberIds = Array.isArray(filters.selectedMemberIds) && filters.selectedMemberIds.length > 0
        ? filters.selectedMemberIds
        : null;

    if (filters.isBulk || selectedMemberIds) {
        const whereClause = selectedMemberIds
            ? { MemberID: { in: selectedMemberIds } }
            : {};

        const members = await db.cnsWeb.member.findMany({
            where: whereClause,
            select: { MemberID: true, MemberCode: true, EmailAddress: true, MemberName: true },
        });

        if (members.length === 0) {
            throw new AppError(status.NOT_FOUND, "No matching members found in the Member table.");
        }

        const users = await db.cnsWeb.user.findMany({
            select: { id: true, email: true, trecHolderId: true },
        });

        if (users.length === 0) {
            throw new AppError(status.NOT_FOUND, "No users found in the User table.");
        }

        const validUserIds = new Set<string>(users.map((u) => u.id));
        const fallbackUserId = validUserIds.has(userId) ? userId : users[0].id;

        const emailToUserIdMap = new Map<string, string>();
        const trecIdToUserIdMap = new Map<string, string>();
        for (const u of users) {
            if (u.email) emailToUserIdMap.set(u.email.toLowerCase().trim(), u.id);
            if (u.trecHolderId) trecIdToUserIdMap.set(u.trecHolderId.trim(), u.id);
        }

        let createdCount = 0;

        for (const m of members) {
            const memberId = m.MemberID || m.MemberCode;
            if (!memberId) continue;

            const matchedUserId =
                trecIdToUserIdMap.get(memberId) ||
                (m.EmailAddress && emailToUserIdMap.get(m.EmailAddress.toLowerCase().trim()));

            const targetUserId = (matchedUserId && validUserIds.has(matchedUserId))
                ? matchedUserId
                : fallbackUserId;

            const bQueueJobId = uuidv4();
            const { selectedMemberIds: _omitSelectedIds, isBulk: _omitIsBulk, ...restFilters } = filters;
            const memberFilters = {
                ...restFilters,
                trecHolderId: memberId,
                memberCode: m.MemberCode ?? memberId,
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

            await enqueueReportJob({
                reportJobId: reportJob.id,
                userId: targetUserId,
                reportType: dto.reportType,
                format: dto.format,
                filters: memberFilters,
            });

            createdCount++;
        }

        writeAuditLog({
            userId,
            action: "REPORT_REQUESTED",
            entity: "ReportJob",
            payload: { reportType: dto.reportType, bulkCount: createdCount },
        });

        return {
            jobId: "bulk-batch",
            queueJobId: "bulk-batch",
            status: "PENDING",
            reportType: dto.reportType,
            format: dto.format,
            requestedAt: new Date(),
            estimatedWait: 30,
            message: `Successfully enqueued ${createdCount} report jobs for selected members.`,
        };
    }

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

    // Never persist selectedMemberIds/isBulk in the filters column — only
    // trecHolderId is needed to look up/search a trecholder's own reports.
    delete filters.selectedMemberIds;
    delete filters.isBulk;

    const requestingUser = await db.cnsWeb.user.findUnique({
        where: { id: userId },
        select: { id: true, trecHolderId: true },
    });
    if (!requestingUser) {
        throw new AppError(status.UNAUTHORIZED, "User account not found. Please log in again.");
    }

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
        if (targetUser?.id) {
            jobTargetUserId = targetUser.id;
        }
    }

    const targetUserExists = await db.cnsWeb.user.findUnique({
        where: { id: jobTargetUserId },
        select: { id: true },
    });
    if (!targetUserExists) {
        jobTargetUserId = userId;
    }

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

    await enqueueReportJob({
        reportJobId: reportJob.id,
        userId: jobTargetUserId,
        reportType: dto.reportType,
        format: dto.format,
        filters,
    });

    writeAuditLog({
        userId,
        action: "REPORT_REQUESTED",
        entity: "ReportJob",
        entityId: reportJob.id,
        payload: { reportType: dto.reportType, format: dto.format, filters },
    });

    return {
        jobId: reportJob.id,
        queueJobId,
        status: "PENDING",
        reportType: dto.reportType,
        format: dto.format,
        requestedAt: reportJob.requestedAt,
        estimatedWait: 10,
    };
};

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
                  { filters: { contains: `"trecHolderId":"${userTrecId}"` } },
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

const getJob = async (jobId: string, userId: string, userRole: string) => {
    // Check Redis cache for polling optimization
    const cachedJob = await reportCache.getJob<any>(jobId);
    if (cachedJob) {
        return cachedJob;
    }

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
        (Boolean(userTrecId) && Boolean(job.filters?.includes(`"trecHolderId":"${userTrecId}"`)));

    if (!canAccess) {
        throw new AppError(
            status.FORBIDDEN,
            "You don't have permission to view this report job."
        );
    }

    await reportCache.setJob(jobId, job);
    return job;
};

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

    await reportCache.invalidateJob(jobId);
    writeAuditLog({
        userId,
        action: "REPORT_CANCELLED",
        entity: "ReportJob",
        entityId: jobId,
    });

    return updated;
};

const deleteJob = async (
    jobId: string,
    userId: string,
    userRole: string
) => {
    const job = await getJob(jobId, userId, userRole);
    const isAdminOrIT = ["ADMIN", "IT"].includes(userRole);

    if (isAdminOrIT) {
        if (job.filePath) {
            await storageLib.deleteReport(job.filePath);
        }
        const deleted = await db.cnsWeb.reportJob.delete({
            where: { id: jobId },
        });

        await reportCache.invalidateJob(jobId);
        writeAuditLog({
            userId,
            action: "REPORT_DELETED",
            entity: "ReportJob",
            entityId: jobId,
        });

        return deleted;
    }

    return cancelJob(jobId, userId, userRole);
};

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

    const jobs = await db.cnsWeb.reportJob.findMany({
        where,
        select: { id: true, filePath: true },
    });

    for (const job of jobs) {
        if (job.filePath) {
            await storageLib.deleteReport(job.filePath);
            await reportCache.invalidateJob(job.id);
        }
    }

    const result = await db.cnsWeb.reportJob.deleteMany({ where });

    writeAuditLog({
        userId,
        action: "REPORT_DELETED",
        entity: "ReportJob",
        payload: { bulkCount: result.count, reportType, statusFilter },
    });

    return {
        count: result.count,
    };
};

const getMembersList = async () => {
    const cachedMembers = await reportCache.getMembersList<any[]>();
    if (cachedMembers) {
        return cachedMembers;
    }

    const members = await db.cnsWeb.member.findMany({
        select: {
            MemberID: true,
            MemberCode: true,
            MemberName: true,
        },
        orderBy: { MemberID: "asc" },
    });

    const result = members.map((m) => ({
        memberId: m.MemberID,
        memberCode: m.MemberCode,
        memberName: m.MemberName ?? m.MemberCode ?? m.MemberID,
    }));

    await reportCache.setMembersList(result);
    return result;
};

export const ReportService = {
    requestReport,
    getJobs,
    getJob,
    cancelJob,
    deleteJob,
    deleteAllJobs,
    getJobForDownload,
    getMembersList,
};
