import ExcelJS, { type CellValue } from "exceljs";
import { ReportBuilder, BuildResult } from "./base.builder.js";

// ---------------------------------------------------------------------------
// XLSX Report Builder — uses ExcelJS to create a styled workbook.
// ---------------------------------------------------------------------------

export class XlsxBuilder extends ReportBuilder {
    readonly title: string;

    constructor(title = "Report") {
        super();
        this.title = title;
    }

    async generate(
        data: Record<string, unknown>[],
        filters?: Record<string, unknown>
    ): Promise<BuildResult> {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "CSE-CNS Report Engine";
        workbook.created = new Date();

        const sheet = workbook.addWorksheet(this.title, {
            pageSetup: { fitToPage: true, orientation: "landscape" },
        });

        // --- Title row ---
        const headers = data.length > 0 ? Object.keys(data[0]) : [];
        const colCount = Math.max(headers.length, 1);

        sheet.mergeCells(1, 1, 1, colCount);
        const titleCell = sheet.getCell("A1");
        titleCell.value = this.title;
        titleCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
        titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        sheet.getRow(1).height = 36;

        // --- Filters row ---
        let dataStartRow = 3;
        if (filters && Object.keys(filters).length > 0) {
            const filterStr = Object.entries(filters)
                .filter(([, v]) => v != null && v !== "")
                .map(([k, v]) => `${k}: ${v}`)
                .join("  |  ");

            sheet.mergeCells(2, 1, 2, colCount);
            const filterCell = sheet.getCell("A2");
            filterCell.value = `Filters: ${filterStr}`;
            filterCell.font = { italic: true, size: 10, color: { argb: "FF555555" } };
            filterCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
            filterCell.alignment = { horizontal: "left", vertical: "middle" };
            sheet.getRow(2).height = 20;
            dataStartRow = 3;
        }

        // --- Header row ---
        const headerRow = sheet.getRow(dataStartRow);
        headers.forEach((h, i) => {
            const cell = headerRow.getCell(i + 1);
            cell.value = this._humanise(h);
            cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2C5F8A" } };
            cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
            cell.border = {
                bottom: { style: "thin", color: { argb: "FFB0C4DE" } },
            };
            // Auto-width based on header label length
            sheet.getColumn(i + 1).width = Math.max(h.length + 4, 14);
        });
        headerRow.height = 24;

        // --- Data rows ---
        data.forEach((row, rowIdx) => {
            const sheetRow = sheet.getRow(dataStartRow + 1 + rowIdx);
            headers.forEach((h, colIdx) => {
                const cell = sheetRow.getCell(colIdx + 1);
                const val = row[h];
                cell.value = val instanceof Date ? val : ((val ?? "") as CellValue);
                cell.alignment = { vertical: "middle", wrapText: false };
                // Zebra stripes
                if (rowIdx % 2 === 1) {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
                }
            });
            sheetRow.height = 20;
        });

        // --- Freeze header ---
        sheet.views = [{ state: "frozen", ySplit: dataStartRow }];

        // --- Auto-fit columns (conservative max 50) ---
        sheet.columns.forEach((col) => {
            col.width = Math.min((col.width ?? 14), 50);
        });

        const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
        return {
            buffer,
            mimeType:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            extension: "xlsx",
        };
    }

    /** Convert camelCase / snake_case keys to "Human Readable" labels */
    private _humanise(key: string): string {
        return key
            .replace(/([A-Z])/g, " $1")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .trim();
    }
}
