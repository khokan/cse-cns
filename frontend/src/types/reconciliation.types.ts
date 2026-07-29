// ---------------------------------------------------------------------------
// Reconciliation Dashboard — types (mirrors backend reconciliation.interface.ts)
// ---------------------------------------------------------------------------

export interface ReceivableSummary {
  spot: number;
  abgn: number;
  z: number;
  totalValue: number;
}

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

export interface CashFlowSummaryRow {
  sn: number | null;
  settlementDate: string | null;
  activity: string | null;
  cashIn: number;
  cashOut: number;
  cashMovement: number;
  isTotalRow: boolean;
}

export interface ReconciliationSummary {
  date: string;
  receivable: ReceivableSummary;
  transactions: TransactionSummaryRow[];
  cashFlow: CashFlowSummaryRow[];
  generatedAt: string;
}
