import fastCsv from "fast-csv";
import { ReportBuilder, BuildResult } from "./base.builder.js";
import type { TaxCertificateData } from "./tax-certificate.types.js";

// ---------------------------------------------------------------------------
// Tax Certificate CSV Builder
// Produces a two-section flat CSV: Section 04 first, then Section 05.
// ---------------------------------------------------------------------------

export class TaxCertificateCsvBuilder extends ReportBuilder {
    readonly title = "Certificate of Collection of Tax";

    async generate(
        data: Record<string, unknown>[],
        _filters?: Record<string, unknown>
    ): Promise<BuildResult> {
        const cert = data[0] as unknown as TaxCertificateData;
        const buffer = await this._buildCsv(cert);
        return {
            buffer,
            mimeType: "text/csv",
            extension: "csv",
        };
    }

    private _buildCsv(cert: TaxCertificateData): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            const stream = fastCsv.format({ headers: false });

            stream.on("data", (chunk: Buffer) => chunks.push(chunk));
            stream.on("end",  () => resolve(Buffer.concat(chunks)));
            stream.on("error", reject);

            // ---- Certificate header info ----
            stream.write(["Certificate of Collection of Tax"]);
            stream.write(["Section 145(1) of the Income Tax Act, 2023"]);
            stream.write([]);
            stream.write([cert.referenceNumber, "", "", "", "", cert.issueDate]);
            stream.write([]);
            stream.write(["01", "Name of TREC Holder & TREC No.", cert.trecHolder.name]);
            stream.write(["02", "Address",                        cert.trecHolder.address]);
            stream.write(["03", "Twelve-digit TIN",               cert.trecHolder.tin]);
            stream.write([]);

            // ---- Section 04 ----
            stream.write(["04. Particulars of collection of Tax"]);
            stream.write([
                "Sl.", "Month of Collection", "Description of Collection Tax",
                "Applicable Section", "Trade Volume (Tk.)", "Income Tax (Tk.)",
            ]);
            for (const r of cert.collectionRows) {
                stream.write([r.sl, r.monthLabel, r.description, r.section, r.tradeVolume, r.incomeTax]);
            }
            const totalTradeVolume = cert.collectionRows
                .reduce((sum, r) => sum + (parseFloat(String(r.tradeVolume).replace(/,/g, "")) || 0), 0)
                .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            const totalIncomeTax = cert.collectionRows
                .reduce((sum, r) => sum + (parseFloat(String(r.incomeTax).replace(/,/g, "")) || 0), 0)
                .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            stream.write(["", "", "", "Total", totalTradeVolume, totalIncomeTax]);
            stream.write([]);

            // ---- Section 05 ----
            stream.write(["05. Payment of collected tax to the credit of the Government"]);
            stream.write([
                "Sl.", "Challan Number", "Challan Date", "Month", "Bank & Branch", "Total Amount In Challan",
            ]);
            for (const r of cert.challanRows) {
                stream.write([`${r.sl}.`, r.challanNumber, r.challanDate, r.month, r.bankBranch, r.totalAmount]);
            }
            stream.write([]);

            // ---- Footer ----
            stream.write([
                "This is a system-generated certificate issued by Chittagong Stock Exchange PLC based on C&S records. No signature or seal is required.",
            ]);

            stream.end();
        });
    }
}
