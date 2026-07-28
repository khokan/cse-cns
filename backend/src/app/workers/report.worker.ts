import { db } from "../lib/prisma.js";
import { storageLib } from "../lib/storage.js";
import { CsvBuilder } from "../modules/reports/builders/csv.builder.js";
import { XlsxBuilder } from "../modules/reports/builders/xlsx.builder.js";
import { PdfBuilder } from "../modules/reports/builders/pdf.builder.js";
import type { ReportJobPayload, ReportFormat } from "../modules/reports/report.interface.js";
import type { ReportBuilder } from "../modules/reports/builders/base.builder.js";

// ---------------------------------------------------------------------------
// DATA FETCHERS — one function per reportType
// Each fetcher returns an array of plain objects ready for the builders.
// ---------------------------------------------------------------------------

const REPORT_TITLES: Record<string, string> = {
    member_list: "Member Listing Report",
    trec_holder_summary: "TrecHolder Summary Report",
    user_activity: "User Activity Report",
    financial_summary: "Financial Summary Report",
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

async function fetchTrecHolderSummary(filters: Filters): Promise<Record<string, unknown>[]> {
    const holders = await db.cnsWeb.trecHolder.findMany({
        where: {
            isDeleted: false,
            ...(filters.search
                ? { OR: [{ name: { contains: filters.search as string } }, { email: { contains: filters.search as string } }] }
                : {}),
        },
        orderBy: { createdAt: "desc" },
    });

    return holders.map((h) => ({
        "ID": h.id,
        "Name": h.name,
        "Email": h.email,
        "Contact": h.contactNumber ?? "",
        "Address": h.address ?? "",
        "Created At": h.createdAt.toISOString().split("T")[0],
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
    // Financial report aggregates member bank/account data from CNS
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

// ---------------------------------------------------------------------------
// Builder factory
// ---------------------------------------------------------------------------

function createBuilder(format: ReportFormat, title: string): ReportBuilder {
    switch (format) {
        case "CSV":
            return new CsvBuilder(title);
        case "XLSX":
            return new XlsxBuilder(title);
        case "PDF":
            return new PdfBuilder(title);
        default:
            throw new Error(`Unsupported format: ${format}`);
    }
}

// ---------------------------------------------------------------------------
// Data fetcher router
// ---------------------------------------------------------------------------

async function fetchData(
    reportType: string,
    filters: Filters
): Promise<Record<string, unknown>[]> {
    switch (reportType) {
        case "member_list":
            return fetchMemberList(filters);
        case "trec_holder_summary":
            return fetchTrecHolderSummary(filters);
        case "user_activity":
            return fetchUserActivity(filters);
        case "financial_summary":
            return fetchFinancialSummary(filters);
        default:
            throw new Error(`Unknown report type: ${reportType}`);
    }
}

// ---------------------------------------------------------------------------
// Main processor — called by the queue for each job
// ---------------------------------------------------------------------------

export async function processReportJob(payload: ReportJobPayload): Promise<void> {
    const { reportJobId, userId, reportType, format, filters } = payload;

    console.log(`📊 [Worker] Processing job ${reportJobId} | ${reportType} | ${format}`);

    // Mark as PROCESSING
    await db.cnsWeb.reportJob.update({
        where: { id: reportJobId },
        data: { status: "PROCESSING", startedAt: new Date() },
    });

    try {
        // 1. Fetch data
        const data = await fetchData(reportType, filters as Filters);

        // 2. Build the report file
        const title = REPORT_TITLES[reportType] ?? "Report";
        const builder = createBuilder(format, title);
        const { buffer, extension } = await builder.generate(data, filters as Filters);

        // 3. Save to local disk
        const { filePath, fileSize } = await storageLib.saveReport(
            userId,
            reportJobId,
            extension,
            buffer
        );

        const fileName = `${reportType}_${new Date().toISOString().split("T")[0]}.${extension}`;

        // 4. Update DB → COMPLETED
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

        console.log(`✅ [Worker] Job ${reportJobId} completed. File: ${filePath} (${fileSize} bytes)`);
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
    }
}
