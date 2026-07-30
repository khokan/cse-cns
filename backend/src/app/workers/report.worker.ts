import { Worker, Job } from "bullmq";
import { bullMqRedisConnection, reportCache } from "../lib/redis.js";
import { REPORT_QUEUE_NAME } from "../queues/report.queue.js";
import { db } from "../lib/prisma.js";
import { storageLib } from "../lib/storage.js";
import { CsvBuilder } from "../modules/reports/builders/csv.builder.js";
import { XlsxBuilder } from "../modules/reports/builders/xlsx.builder.js";
import { PdfBuilder } from "../modules/reports/builders/pdf.builder.js";
import { TaxCertificatePdfBuilder } from "../modules/reports/builders/tax-certificate.pdf.builder.js";
import { TaxCertificateXlsxBuilder } from "../modules/reports/builders/tax-certificate.xlsx.builder.js";
import { TaxCertificateCsvBuilder } from "../modules/reports/builders/tax-certificate.csv.builder.js";
import type { ReportJobPayload, ReportFormat } from "../modules/reports/report.interface.js";
import type { ReportBuilder } from "../modules/reports/builders/base.builder.js";
import type {
    SpRawRow,
    TaxCertificateData,
    CollectionRow,
    ChallanRow,
} from "../modules/reports/builders/tax-certificate.types.js";
import { emitToUser } from "../lib/socket.js";

const REPORT_TITLES: Record<string, string> = {
    member_list: "Member Listing Report",
    trec_holder_tax_certificate: "Certificate of Collection of Tax",
};

type Filters = Record<string, unknown>;

async function fetchMemberList(filters: Filters): Promise<Record<string, unknown>[]> {
    const members = await db.cnsWeb.member.findMany({
        where: {
            ...(filters.memberCode ? { MemberCode: { contains: filters.memberCode as string } } : {}),
            ...(filters.region ? { ClearingRegionID: filters.region as string } : {}),
        },
        orderBy: { MemberCode: "asc" },
    });

    return members.map((m) => ({
        "Member ID": m.MemberID,
        "Member Code": m.MemberCode,
        "Member Name": m.MemberName ?? "",
        "Address": m.MemberAddress ?? "",
        "Region": m.ClearingRegionID ?? "",
        "Account Code": m.AccountCode ?? "",
        "Bank Account": m.BankAccountNumber ?? "",
        "Mobile": m.MobileNumber ?? "",
        "Email": m.EmailAddress ?? "",
    }));
}


async function fetchUserActivity(filters: Filters): Promise<Record<string, unknown>[]> {
    const sessions = await db.cnsWeb.session.findMany({
        where: {
            ...(filters.userId ? { userId: filters.userId as string } : {}),
            ...(filters.dateFrom || filters.dateTo
                ? {
                    createdAt: {
                        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom as string) } : {}),
                        ...(filters.dateTo ? { lte: new Date(filters.dateTo as string) } : {}),
                    },
                }
                : {}),
        },
        include: { user: { select: { name: true, email: true, role: true } } },
        orderBy: { createdAt: "desc" },
        take: 1000,
    });

    return sessions.map((s) => ({
        "Session ID": s.id,
        "User Name": s.user?.name ?? "",
        "User Email": s.user?.email ?? "",
        "Role": s.user?.role ?? "",
        "IP Address": s.ipAddress ?? "",
        "User Agent": s.userAgent ?? "",
        "Created At": s.createdAt.toISOString().replace("T", " ").split(".")[0],
        "Expires At": s.expiresAt.toISOString().replace("T", " ").split(".")[0],
    }));
}

async function fetchFinancialSummary(filters: Filters): Promise<Record<string, unknown>[]> {
    const members = await db.cnsWeb.member.findMany({
        where: {
            NOT: { AccountCode: null },
            ...(filters.region ? { ClearingRegionID: filters.region as string } : {}),
        },
        orderBy: { AccountCode: "asc" },
    });

    return members.map((m) => ({
        "Member Code": m.MemberCode,
        "Member Name": m.MemberName ?? "",
        "Account Code": m.AccountCode ?? "",
        "Bank Routing No.": m.BankRoutingNumber ?? "",
        "Bank Account No.": m.BankAccountNumber ?? "",
        "Bank Account Type": m.BankAccountType ?? "",
        "EFT": m.EFT ?? 0,
        "TIN": m.TIN ?? "",
        "Region": m.ClearingRegionID ?? "",
    }));
}

function fiscalYearToDates(fiscalYear: string): { fromDate: string; toDate: string } {
    const [startYear] = fiscalYear.split("-").map(Number);
    if (!startYear || isNaN(startYear)) {
        throw new Error(`Invalid fiscalYear format: "${fiscalYear}". Expected e.g. "2024-2025".`);
    }
    return {
        fromDate: `01-Jul-${startYear}`,
        toDate: `30-Jun-${startYear + 1}`,
    };
}

function fmtDecimal(raw: string | number | null | undefined): string {
    if (raw == null || raw === "") return "0.00";
    const num = typeof raw === "string" ? parseFloat(raw) : raw;
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtChallanDate(raw: Date | string | null | undefined): string {
    if (!raw) return "";
    const d = raw instanceof Date ? raw : new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}.${mm}.${yy}`;
}

function fmtIssueDate(): string {
    const d = new Date();
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dd = String(d.getDate()).padStart(2, "0");
    return `${dd}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
}

async function fetchTaxCertificate(filters: Filters): Promise<Record<string, unknown>[]> {
    const fiscalYear = (filters.fiscalYear as string | undefined) ?? "";
    const trecHolderId = (filters.trecHolderId as string | undefined) ?? "";
    const memberCodeDirect = (filters.memberCode as string | undefined) ?? "";

    if (!fiscalYear) {
        throw new Error("fiscalYear filter is required for the tax certificate report (e.g. \"2024-2025\").");
    }
    if (!trecHolderId && !memberCodeDirect) {
        throw new Error("Either trecHolderId or memberCode filter is required for the tax certificate report.");
    }

    const rawFilterId = (filters.trecHolderId as string | undefined) || (filters.memberCode as string | undefined) || "";

    const member = await db.cnsWeb.member.findFirst({
        where: {
            OR: [{ MemberID: rawFilterId }, { MemberCode: rawFilterId }],
        },
    });

    const memberId = member?.MemberID || rawFilterId;
    const tin = member?.TIN ?? "";

    const { fromDate, toDate } = fiscalYearToDates(fiscalYear);

    // -----------------------------------------------------------------------
    // 3. Execute stored procedure
    //    EXEC [dbo].[USP_Certificate_Show] @FromDate = '...', @ToDate = '...', @MemberID = '...'
    // -----------------------------------------------------------------------
    console.log(`📋 [TaxCert] Calling Certificate_Show | MemberID=${memberId} | ${fromDate} → ${toDate}`);

    const rows = await db.cns.$queryRawUnsafe<SpRawRow[]>(
        `EXEC [dbo].[USP_Certificate_Show] @FromDate = '${fromDate}', @ToDate = '${toDate}', @MemberID = '${memberId}'`
    );

    if (!rows || rows.length === 0) {
        throw new Error(
            `Certificate_Show returned no data for MemberID="${memberId}", ${fromDate} → ${toDate}.`
        );
    }

    const firstRow = rows[0];
    const referenceNumber = firstRow.ReferenceNumber ?? `CSE/TRECHolderTax/${fiscalYear}`;
    const memberName = (firstRow.MemberName ?? "").replace(/\.$/, "").trim();
    const memberAddress = (firstRow.MemberAddress ?? "").trim();

    const monthMap = new Map<string, { tradeVolume: number; incomeTax: number }>();

    for (const row of rows) {
        const month = (row.Month ?? "").trim();
        if (!month) continue;

        const tv = parseFloat(String(row["Trade Volume"] ?? "0")) || 0;
        const arc = parseFloat(String(row["Amount Relating to this Certificate"] ?? "0")) || 0;

        if (monthMap.has(month)) {
            const existing = monthMap.get(month)!;
            existing.tradeVolume += tv;
            existing.incomeTax += arc;
        } else {
            monthMap.set(month, { tradeVolume: tv, incomeTax: arc });
        }
    }

    const collectionRows: CollectionRow[] = Array.from(monthMap.entries()).map(
        ([monthLabel, totals], idx) => ({
            sl: idx + 1,
            monthLabel,
            description: "Collection of Tax",
            section: "137",
            tradeVolume: fmtDecimal(totals.tradeVolume),
            incomeTax: fmtDecimal(totals.incomeTax),
        })
    );

    const challanRows: ChallanRow[] = rows.map((row, idx) => ({
        sl: idx + 1,
        challanNumber: (row["Challan Number"] ?? "").trim(),
        challanDate: fmtChallanDate(row["Challan Date"]),
        month: (row.Month ?? "").trim(),
        bankBranch: (row.BankBranch ?? "").trim(),
        totalAmount: fmtDecimal(row["Total Amount in Challan"]),
    }));

    const certData: TaxCertificateData = {
        referenceNumber,
        issueDate: fmtIssueDate(),
        fromDate,
        toDate,
        trecHolder: {
            name: memberName,
            address: memberAddress,
            tin,
        },
        collectionRows,
        challanRows,
    };

    return [certData as unknown as Record<string, unknown>];
}

const TAX_CERT = "trec_holder_tax_certificate";

function createBuilder(reportType: string, format: ReportFormat, title: string): ReportBuilder {
    if (reportType === TAX_CERT) {
        switch (format) {
            case "PDF": return new TaxCertificatePdfBuilder();
            case "XLSX": return new TaxCertificateXlsxBuilder();
            case "CSV": return new TaxCertificateCsvBuilder();
            default: throw new Error(`Unsupported format for tax certificate: ${format}`);
        }
    }

    switch (format) {
        case "CSV": return new CsvBuilder(title);
        case "XLSX": return new XlsxBuilder(title);
        case "PDF": return new PdfBuilder(title);
        default: throw new Error(`Unsupported format: ${format}`);
    }
}

async function fetchData(
    reportType: string,
    filters: Filters
): Promise<Record<string, unknown>[]> {
    switch (reportType) {
        case "member_list": return fetchMemberList(filters);
        case TAX_CERT: return fetchTaxCertificate(filters);
        default: throw new Error(`Unknown report type: ${reportType}`);
    }
}

// ---------------------------------------------------------------------------
// Main Processor Function
// ---------------------------------------------------------------------------
export async function processReportJob(payload: ReportJobPayload): Promise<void> {
    const { reportJobId, userId, reportType, format, filters } = payload;

    console.log(`📊 [Worker] Processing job ${reportJobId} | ${reportType} | ${format}`);

    await db.cnsWeb.reportJob.update({
        where: { id: reportJobId },
        data: { status: "PROCESSING", startedAt: new Date() },
    });

    emitToUser(userId, "report:status", { jobId: reportJobId, status: "PROCESSING" });
    await reportCache.invalidateJob(reportJobId);

    try {
        const data = await fetchData(reportType, filters as Filters);
        const title = REPORT_TITLES[reportType] ?? "Report";
        const builder = createBuilder(reportType, format, title);
        const { buffer, extension } = await builder.generate(data, filters as Filters);

        const { filePath, fileSize } = await storageLib.saveReport(
            userId,
            reportJobId,
            extension,
            buffer
        );

        const fileName = `${reportType}_${new Date().toISOString().split("T")[0]}.${extension}`;

        await db.cnsWeb.reportJob.update({
            where: { id: reportJobId },
            data: {
                status: "COMPLETED",
                filePath,
                fileSize,
                fileName,
                completedAt: new Date(),
            },
        });

        await reportCache.invalidateJob(reportJobId);
        emitToUser(userId, "report:status", {
            jobId: reportJobId,
            status: "COMPLETED",
            filePath,
            fileName,
        });

        console.log(`✅ [Worker] Job ${reportJobId} completed. File: ${filePath}`);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`❌ [Worker] Job ${reportJobId} failed:`, errorMessage);

        await db.cnsWeb.reportJob.update({
            where: { id: reportJobId },
            data: {
                status: "FAILED",
                errorMessage,
                completedAt: new Date(),
            },
        });

        await reportCache.invalidateJob(reportJobId);
        emitToUser(userId, "report:status", {
            jobId: reportJobId,
            status: "FAILED",
            errorMessage,
        });
    }
}

// ---------------------------------------------------------------------------
// BullMQ Worker Class Instance
// ---------------------------------------------------------------------------
export let reportWorker: Worker<ReportJobPayload> | null = null;

export const initReportWorker = (): Worker<ReportJobPayload> => {
    reportWorker = new Worker<ReportJobPayload>(
        REPORT_QUEUE_NAME,
        async (job: Job<ReportJobPayload>) => {
            await processReportJob(job.data);
        },
        { connection: bullMqRedisConnection }
    );

    reportWorker.on("completed", (job) => {
        console.log(`✅ [ReportWorker] Job ${job.id} marked as completed in BullMQ.`);
    });

    reportWorker.on("failed", (job, err) => {
        console.error(`❌ [ReportWorker] Job ${job?.id} failed in BullMQ:`, err.message);
    });

    return reportWorker;
};
