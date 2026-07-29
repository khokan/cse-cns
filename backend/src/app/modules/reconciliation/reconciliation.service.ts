import status from "http-status";
import { db } from "../../lib/prisma.js";
import AppError from "../../errorHelpers/AppError.js";
import { logger } from "../../utils/logger.js";
import type {
    ReceivableSummaryRawRow,
    ReceivableSummary,
    TransactionSummaryRawRow,
    TransactionSummaryRow,
    CashFlowSummaryRawRow,
    CashFlowSummaryRow,
    ReconciliationSummary,
} from "./reconciliation.interface.js";

// ---------------------------------------------------------------------------
// Default settlement date used by all 3 stored procedures when the caller
// does not supply one (matches the sample dataset: 02-Jun-2024).
// ---------------------------------------------------------------------------
const DEFAULT_RECONCILIATION_DATE = "2024-06-02";

// Strict YYYY-MM-DD validation to safely interpolate into raw EXEC statements
// (queryRawUnsafe does not support parameterized EXEC args reliably here).
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const resolveDate = (date?: string): string => {
    if (!date) return DEFAULT_RECONCILIATION_DATE;
    if (!DATE_PATTERN.test(date)) {
        throw new AppError(
            status.BAD_REQUEST,
            `Invalid date "${date}". Expected format YYYY-MM-DD.`
        );
    }
    return date;
};

// ---------------------------------------------------------------------------
// Helpers — safe numeric / date coercion for raw SQL results
// ---------------------------------------------------------------------------
const toNumber = (value: unknown): number => {
    if (value === null || value === undefined) return 0;
    const n = typeof value === "number" ? value : parseFloat(String(value));
    return Number.isFinite(n) ? n : 0;
};

const toDateString = (value: unknown): string | null => {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

// ---------------------------------------------------------------------------
// 1. Receivable Summary — EXEC [dbo].[usp_Reconciliation_ReceivableSummary]
// ---------------------------------------------------------------------------
const getReceivableSummary = async (date?: string): Promise<ReceivableSummary> => {
    const resolvedDate = resolveDate(date);
    try {
        const rows = await db.cns.$queryRawUnsafe<ReceivableSummaryRawRow[]>(
            `EXEC [dbo].[usp_Reconciliation_ReceivableSummary] @Date = '${resolvedDate}'`
        );

        if (!rows || rows.length === 0) {
            throw new AppError(
                status.NOT_FOUND,
                `Reconciliation_Receivable_Summary returned no data for ${resolvedDate}.`
            );
        }

        const row = rows[0];
        return {
            spot: toNumber(row["Spot (Taka)"]),
            abgn: toNumber(row["ABGN (Taka)"]),
            z: toNumber(row["Z (Taka)"]),
            totalValue: toNumber(row["Total Value in Taka"]),
        };
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error("Failed to execute Reconciliation_ReceivableSummary", error, { date: resolvedDate });
        throw new AppError(
            status.INTERNAL_SERVER_ERROR,
            "Failed to fetch receivable summary from the database."
        );
    }
};

// ---------------------------------------------------------------------------
// 2. Transaction Summary — EXEC [dbo].[usp_Reconciliation_TransactionSummary]
// ---------------------------------------------------------------------------
const getTransactionSummary = async (date?: string): Promise<TransactionSummaryRow[]> => {
    const resolvedDate = resolveDate(date);
    try {
        const rows = await db.cns.$queryRawUnsafe<TransactionSummaryRawRow[]>(
            `EXEC [dbo].[usp_Reconciliation_TransactionSummary] @Date = '${resolvedDate}'`
        );

        if (!rows) {
            throw new AppError(
                status.NOT_FOUND,
                `Reconciliation_TransactionSummary returned no data for ${resolvedDate}.`
            );
        }

        return rows.map((row) => {
            const shareGroup = (row["Share Group"] ?? "").toString().trim();
            return {
                tradeDate: toDateString(row.TradeDate),
                shareGroup,
                collection: toNumber(row.Collection),
                cseCommission: toNumber(row["CSE Commission"]),
                ait: toNumber(row.AIT),
                ipf: toNumber(row.IPF),
                paymentAfterDeductions: toNumber(row["Payment after AIT, Com. & IPF"]),
                isTotalRow: row.TradeDate === null || /^total/i.test(shareGroup),
            };
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error("Failed to execute Reconciliation_TransactionSummary", error, { date: resolvedDate });
        throw new AppError(
            status.INTERNAL_SERVER_ERROR,
            "Failed to fetch transaction summary from the database."
        );
    }
};

// ---------------------------------------------------------------------------
// 3. Cash Flow Summary — EXEC [dbo].[usp_Reconciliation_CashFlowSummary]
// ---------------------------------------------------------------------------
const getCashFlowSummary = async (date?: string): Promise<CashFlowSummaryRow[]> => {
    const resolvedDate = resolveDate(date);
    try {
        const rows = await db.cns.$queryRawUnsafe<CashFlowSummaryRawRow[]>(
            `EXEC [dbo].[usp_Reconciliation_CashFlowSummary] @Date = '${resolvedDate}'`
        );

        if (!rows) {
            throw new AppError(
                status.NOT_FOUND,
                `Reconciliation_CashFlowSummary returned no data for ${resolvedDate}.`
            );
        }

        return rows.map((row) => ({
            sn: row.SN === null || row.SN === undefined ? null : Number(row.SN),
            settlementDate: toDateString(row["Settlement Date"]),
            activity: row.Activity,
            cashIn: toNumber(row["Cash In"]),
            cashOut: toNumber(row["Cash Out"]),
            cashMovement: toNumber(row["Cash Movement"]),
            isTotalRow: row.SN === null || row.Activity === null,
        }));
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error("Failed to execute Reconciliation_CashFlowSummary", error, { date: resolvedDate });
        throw new AppError(
            status.INTERNAL_SERVER_ERROR,
            "Failed to fetch cash flow summary from the database."
        );
    }
};

// ---------------------------------------------------------------------------
// Aggregate — runs all 3 stored procedures concurrently
// ---------------------------------------------------------------------------
const getReconciliationSummary = async (date?: string): Promise<ReconciliationSummary> => {
    const resolvedDate = resolveDate(date);
    logger.info("Fetching reconciliation dashboard summary (3 stored procedures)", { date: resolvedDate });

    const [receivable, transactions, cashFlow] = await Promise.all([
        getReceivableSummary(resolvedDate),
        getTransactionSummary(resolvedDate),
        getCashFlowSummary(resolvedDate),
    ]);

    logger.info("Reconciliation dashboard summary fetched successfully", {
        date: resolvedDate,
        transactionRows: transactions.length,
        cashFlowRows: cashFlow.length,
    });

    return {
        date: resolvedDate,
        receivable,
        transactions,
        cashFlow,
        generatedAt: new Date().toISOString(),
    };
};

export const ReconciliationService = {
    getReceivableSummary,
    getTransactionSummary,
    getCashFlowSummary,
    getReconciliationSummary,
};
