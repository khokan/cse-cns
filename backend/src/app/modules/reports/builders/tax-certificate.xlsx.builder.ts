import ExcelJS from "exceljs";
import { ReportBuilder, BuildResult } from "./base.builder.js";
import type { TaxCertificateData } from "./tax-certificate.types.js";

// ---------------------------------------------------------------------------
// Tax Certificate XLSX Builder
// Produces a structured workbook that mirrors the two-section certificate.
// ---------------------------------------------------------------------------

const DARK_BLUE  = "FF1E3A5F";
const MID_BLUE   = "FF2C5F8A";
const LIGHT_BLUE = "FFD6E4F0";
const RED_TEXT   = "FFC00000";

export class TaxCertificateXlsxBuilder extends ReportBuilder {
    readonly title = "Certificate of Collection of Tax";

    async generate(
        data: Record<string, unknown>[],
        _filters?: Record<string, unknown>
    ): Promise<BuildResult> {
        const cert = data[0] as unknown as TaxCertificateData;
        const wb   = new ExcelJS.Workbook();
        wb.creator  = "CSE-CNS Report Engine";
        wb.created  = new Date();

        const ws = wb.addWorksheet("Certificate", {
            pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
        });

        // Fixed column widths
        ws.columns = [
            { width: 6  },   // A — Sl / label no
            { width: 30 },   // B — Label / challan number
            { width: 18 },   // C — Description / date
            { width: 18 },   // D — Section / month
            { width: 22 },   // E — Trade volume / bank
            { width: 20 },   // F — Income tax / amount
        ];

        let row = 1;

        // ---- Main title ----
        ws.mergeCells(row, 1, row, 6);
        applyCell(ws, row, 1, "Certificate of Collection of Tax", {
            bold: true, size: 18, color: "FF000000",
            fill: "FFFFFFFF", align: "center", vAlign: "middle",
        });
        ws.getRow(row).height = 30;
        row++;

        // ---- Subtitle ----
        ws.mergeCells(row, 1, row, 6);
        applyCell(ws, row, 1, "[Section 145(1) of the Income Tax Act, 2023]", {
            bold: false, size: 10, color: "FF444444",
            fill: "FFFFFFFF", align: "center", vAlign: "middle",
        });
        ws.getRow(row).height = 16;
        row++;

        row++; // blank

        // ---- Reference + Date ----
        ws.mergeCells(row, 1, row, 3);
        applyCell(ws, row, 1, cert.referenceNumber, {
            bold: false, size: 11, color: "FF000000",
            fill: "FFFFFFFF", align: "left", vAlign: "middle",
        });
        ws.mergeCells(row, 4, row, 6);
        applyCell(ws, row, 4, cert.issueDate, {
            bold: false, size: 11, color: "FF000000",
            fill: "FFFFFFFF", align: "right", vAlign: "middle",
        });
        ws.getRow(row).height = 18;
        row++;

        row++; // blank

        // ---- Info rows 01-03 ----
        const infoRows: [string, string, string][] = [
            ["01", "Name of TREC Holder & TREC No.", cert.trecHolder.name],
            ["02", "Address",                        cert.trecHolder.address],
            ["03", "Twelve-digit TIN",               cert.trecHolder.tin],
        ];
        for (const [num, label, value] of infoRows) {
            applyCell(ws, row, 1, num,   { bold: false, size: 11, color: "FF000000", fill: "FFF5F5F5", align: "center", vAlign: "middle", border: true });
            ws.mergeCells(row, 2, row, 2);
            applyCell(ws, row, 2, label, { bold: false, size: 11, color: "FF000000", fill: "FFFFFFFF", align: "left",   vAlign: "middle", border: true });
            ws.mergeCells(row, 3, row, 6);
            applyCell(ws, row, 3, value, { bold: false, size: 11, color: "FF000000", fill: "FFFFFFFF", align: "left",   vAlign: "middle", border: true, underline: true });
            ws.getRow(row).height = 18;
            row++;
        }

        row++; // blank

        // ---- Section 04 header ----
        ws.mergeCells(row, 1, row, 6);
        applyCell(ws, row, 1, "04. Particulars of collection of Tax", {
            bold: false, size: 11, color: "FF000000", fill: "FFFFFFFF", align: "left", vAlign: "middle",
        });
        ws.getRow(row).height = 16;
        row++;

        // Table 04 column headers
        const h04 = ["Sl.", "Month of Collection", "Description of Collection Tax", "Applicable Section", "Trade Volume (Tk.)", "Income Tax (Tk.)"];
        for (let c = 0; c < 6; c++) {
            applyCell(ws, row, c + 1, h04[c], {
                bold: true, size: 10, color: "FFFFFFFF", fill: DARK_BLUE,
                align: "center", vAlign: "middle", border: true, wrapText: true,
            });
        }
        ws.getRow(row).height = 30;
        row++;

        // Table 04 data rows
        for (const r of cert.collectionRows) {
            const vals = [String(r.sl), r.monthLabel, r.description, r.section, r.tradeVolume, r.incomeTax];
            const aligns: ("center" | "left" | "right")[] = ["center", "left", "left", "center", "right", "right"];
            for (let c = 0; c < 6; c++) {
                applyCell(ws, row, c + 1, vals[c], {
                    bold: false, size: 11, color: "FF000000",
                    fill: r.sl % 2 === 0 ? LIGHT_BLUE : "FFFFFFFF",
                    align: aligns[c], vAlign: "middle", border: true,
                });
            }
            ws.getRow(row).height = 18;
            row++;
        }

        const totalTradeVolume = cert.collectionRows
            .reduce((sum, r) => sum + (parseFloat(String(r.tradeVolume).replace(/,/g, "")) || 0), 0)
            .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const totalIncomeTax = cert.collectionRows
            .reduce((sum, r) => sum + (parseFloat(String(r.incomeTax).replace(/,/g, "")) || 0), 0)
            .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // Total row
        ws.mergeCells(row, 1, row, 4);
        applyCell(ws, row, 1, "Total", { bold: true, size: 11, color: "FF000000", fill: "FFF0F0F0", align: "center", vAlign: "middle", border: true });
        applyCell(ws, row, 5, totalTradeVolume, { bold: true, size: 11, color: "FF000000", fill: "FFF0F0F0", align: "right", vAlign: "middle", border: true });
        applyCell(ws, row, 6, totalIncomeTax, { bold: true, size: 11, color: "FF000000", fill: "FFF0F0F0", align: "right", vAlign: "middle", border: true });
        ws.getRow(row).height = 18;
        row++;

        row++; // blank

        // ---- Section 05 header ----
        ws.mergeCells(row, 1, row, 6);
        applyCell(ws, row, 1, "05. Payment of collected tax to the credit of the Government", {
            bold: false, size: 11, color: "FF000000", fill: "FFFFFFFF", align: "left", vAlign: "middle",
        });
        ws.getRow(row).height = 16;
        row++;

        // Table 05 column headers
        const h05 = ["Sl.", "Challan Number", "Challan Date", "Month", "Bank & Branch", "Total Amount In Challan"];
        for (let c = 0; c < 6; c++) {
            applyCell(ws, row, c + 1, h05[c], {
                bold: true, size: 10, color: "FFFFFFFF", fill: MID_BLUE,
                align: "center", vAlign: "middle", border: true, wrapText: true,
            });
        }
        ws.getRow(row).height = 30;
        row++;

        // Table 05 data rows
        for (const r of cert.challanRows) {
            const vals = [r.sl + ".", r.challanNumber, r.challanDate, r.month, r.bankBranch, r.totalAmount];
            const aligns: ("center" | "left" | "right")[] = ["center", "left", "center", "center", "left", "right"];
            for (let c = 0; c < 6; c++) {
                applyCell(ws, row, c + 1, vals[c], {
                    bold: false, size: 11, color: "FF000000",
                    fill: r.sl % 2 === 0 ? LIGHT_BLUE : "FFFFFFFF",
                    align: aligns[c], vAlign: "middle", border: true,
                });
            }
            ws.getRow(row).height = 18;
            row++;
        }

        row++; // blank

        // ---- Footer note ----
        ws.mergeCells(row, 1, row, 6);
        applyCell(ws, row, 1,
            "This is a system-generated certificate issued by Chittagong Stock Exchange PLC based on C&S records. No signature or seal is required.",
            { bold: false, size: 10, color: "FF444444", fill: "FFFFFFFF", align: "left", vAlign: "middle", wrapText: true }
        );
        ws.getRow(row).height = 28;

        const buffer = Buffer.from(await wb.xlsx.writeBuffer());
        return {
            buffer,
            mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            extension: "xlsx",
        };
    }
}

// ---------------------------------------------------------------------------
// Helper: apply all formatting to a single cell
// ---------------------------------------------------------------------------
interface CellStyle {
    bold?: boolean;
    size?: number;
    color?: string;
    fill?: string;
    align?: "left" | "center" | "right";
    vAlign?: "top" | "middle" | "bottom";
    border?: boolean;
    wrapText?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
}

function applyCell(
    ws: ExcelJS.Worksheet,
    row: number,
    col: number,
    value: string,
    style: CellStyle
): void {
    const cell = ws.getCell(row, col);
    cell.value = value;
    cell.font = {
        bold:          style.bold          ?? false,
        size:          style.size          ?? 11,
        color:         { argb: style.color ?? "FF000000" },
        underline:     style.underline     ?? false,
        strike:        style.strikethrough ?? false,
    };
    cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: style.fill ?? "FFFFFFFF" },
    };
    cell.alignment = {
        horizontal: style.align  ?? "left",
        vertical:   style.vAlign ?? "middle",
        wrapText:   style.wrapText ?? false,
    };
    if (style.border) {
        const b: ExcelJS.Border = { style: "thin", color: { argb: "FF000000" } };
        cell.border = { top: b, left: b, bottom: b, right: b };
    }
}
