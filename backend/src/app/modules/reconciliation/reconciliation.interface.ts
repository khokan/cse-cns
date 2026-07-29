// ---------------------------------------------------------------------------
// Reconciliation Dashboard — TypeScript interfaces
// Backed by 3 MSSQL stored procedures on the `cns` database:
//   1. usp_Reconciliation_ReceivableSummary
//   2. usp_Reconciliation_TransactionSummary
//   3. usp_Reconciliation_CashFlowSummary
// ---------------------------------------------------------------------------

/** Raw row shape returned by `usp_Reconciliation_ReceivableSummary` */
export interface ReceivableSummaryRawRow {
    "Spot (Taka)": number | string | null;
    "ABGN (Taka)": number | string | null;
    "Z (Taka)": number | string | null;
    "Total Value in Taka": number | string | null;
}

/** Normalized receivable summary */
export interface ReceivableSummary {
    spot: number;
    abgn: number;
    z: number;
    totalValue: number;
}

/** Raw row shape returned by `usp_Reconciliation_TransactionSummary` */
export interface TransactionSummaryRawRow {
    TradeDate: string | Date | null;
    "Share Group": string | null;
    Collection: number | string | null;
    "CSE Commission": number | string | null;
    AIT: number | string | null;
    IPF: number | string | null;
    "Payment after AIT, Com. & IPF": number | string | null;
}

/** Normalized transaction breakdown row */
export interface TransactionSummaryRow {
    tradeDate: string | null;
    shareGroup: string;
    collection: number;
    cseCommission: number;
    ait: number;
    ipf: number;
    paymentAfterDeductions: number;
    isTotalRow: boolean;
}

/** Raw row shape returned by `usp_Reconciliation_CashFlowSummary` */
export interface CashFlowSummaryRawRow {
    SN: number | string | null;
    "Settlement Date": string | Date | null;
    Activity: string | null;
    "Cash In": number | string | null;
    "Cash Out": number | string | null;
    "Cash Movement": number | string | null;
}

/** Normalized cash flow timeline row */
export interface CashFlowSummaryRow {
    sn: number | null;
    settlementDate: string | null;
    activity: string | null;
    cashIn: number;
    cashOut: number;
    cashMovement: number;
    isTotalRow: boolean;
}

/** Full aggregated dashboard payload */
export interface ReconciliationSummary {
    date: string;
    receivable: ReceivableSummary;
    transactions: TransactionSummaryRow[];
    cashFlow: CashFlowSummaryRow[];
    generatedAt: string;
}
