// ---------------------------------------------------------------------------
// Tax Certificate — typed payload shapes
// Populated from USP_Certificate_Show (single flat result set)
// and consumed by the three specialised builders (PDF, XLSX, CSV).
// ---------------------------------------------------------------------------

/**
 * Raw row returned by USP_Certificate_Show.
 * Column names use exact SQL aliases (spaces preserved).
 */
export interface SpRawRow {
    ReferenceNumber?: string | null;
    FromDate?: Date | string | null;
    ToDate?: Date | string | null;
    MemberName?: string | null;
    MemberID?: string | null;
    MemberAddress?: string | null;
    Month?: string | null;
    "Challan Number"?: string | null;
    "Challan Date"?: Date | string | null;
    "Trade Volume"?: string | number | null;
    "Total Amount in Challan"?: string | number | null;
    "Amount Relating to this Certificate"?: string | number | null;
    BankBranch?: string | null;
}

/**
 * Section 04 — one grouped row per Month
 */
export interface CollectionRow {
    sl: number;
    monthLabel: string;      // e.g. "Jul-2024"
    description: string;     // always "Collection of Tax"
    section: string;         // always "137"
    tradeVolume: string;     // formatted decimal e.g. "22,937,915.60"
    incomeTax: string;       // formatted decimal (Amount Relating to this Certificate)
}

/**
 * Section 05 — one row per challan
 */
export interface ChallanRow {
    sl: number;
    challanNumber: string;   // e.g. "2526-00044214161"
    challanDate: string;     // formatted e.g. "14.08.25"
    month: string;           // e.g. "July-2025"
    bankBranch: string;      // e.g. "IFIC, Agrabad"
    totalAmount: string;     // formatted decimal e.g. "1,834,759.08"
}

/**
 * Complete certificate payload assembled from the SP result set.
 */
export interface TaxCertificateData {
    referenceNumber: string;   // full e.g. "CSE/TRECHolderTax/2026-44"
    issueDate: string;         // e.g. "21-Jul-2026" (today's date, formatted)
    fromDate: string;          // e.g. "01-Jul-2024"
    toDate: string;            // e.g. "30-Jun-2025"
    trecHolder: {
        name: string;          // e.g. "ALPHA SECURITIES LIMITED"
        address: string;       // e.g. "Progati House, 1070, Sk. Mujib Road, Agrabad, CHITTAGONG."
        tin: string;           // from CNSWeb Member.TIN
    };
    collectionRows: CollectionRow[];
    challanRows: ChallanRow[];
}
