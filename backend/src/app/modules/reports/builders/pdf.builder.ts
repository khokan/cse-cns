import puppeteer from "puppeteer";
import { ReportBuilder, BuildResult } from "./base.builder.js";

// ---------------------------------------------------------------------------
// PDF Report Builder — uses Puppeteer to render an HTML template → PDF Buffer.
// On Windows, Puppeteer auto-downloads Chromium — no extra config needed.
// ---------------------------------------------------------------------------

export class PdfBuilder extends ReportBuilder {
    readonly title: string;

    constructor(title = "Report") {
        super();
        this.title = title;
    }

    async generate(
        data: Record<string, unknown>[],
        filters?: Record<string, unknown>
    ): Promise<BuildResult> {
        const html = this._buildHtml(data, filters);

        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: "domcontentloaded" });

            const pdfBuffer = await page.pdf({
                format: "A4",
                landscape: data.length > 0 && Object.keys(data[0]).length > 5,
                printBackground: true,
                margin: { top: "16mm", bottom: "16mm", left: "12mm", right: "12mm" },
                displayHeaderFooter: true,
                headerTemplate: `<div></div>`,
                footerTemplate: `
                    <div style="font-size:9px;color:#888;width:100%;padding:0 12mm;display:flex;justify-content:space-between;">
                        <span>CSE-CNS Report System</span>
                        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
                        <span>${new Date().toLocaleDateString()}</span>
                    </div>`,
            });

            return {
                buffer: Buffer.from(pdfBuffer),
                mimeType: "application/pdf",
                extension: "pdf",
            };
        } finally {
            await browser.close();
        }
    }

    private _buildHtml(
        data: Record<string, unknown>[],
        filters?: Record<string, unknown>
    ): string {
        const headers = data.length > 0 ? Object.keys(data[0]) : [];

        const filterHtml =
            filters && Object.keys(filters).filter((k) => filters[k] != null && filters[k] !== "").length > 0
                ? `<div class="filters">
                    <strong>Filters:</strong>
                    ${Object.entries(filters)
                        .filter(([, v]) => v != null && v !== "")
                        .map(([k, v]) => `<span class="filter-tag">${this._humanise(k)}: <b>${v}</b></span>`)
                        .join("")}
                   </div>`
                : "";

        const theadHtml = `<thead><tr>${headers.map((h) => `<th>${this._humanise(h)}</th>`).join("")}</tr></thead>`;

        const tbodyHtml = `<tbody>${data
            .map(
                (row, i) =>
                    `<tr class="${i % 2 === 1 ? "alt" : ""}">
                        ${headers.map((h) => `<td>${row[h] ?? ""}</td>`).join("")}
                    </tr>`
            )
            .join("")}</tbody>`;

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a2e; }
  .header { background: linear-gradient(135deg, #1e3a5f 0%, #2c5f8a 100%); color: #fff; padding: 14px 20px; border-radius: 6px 6px 0 0; }
  .header h1 { font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
  .header p  { font-size: 10px; opacity: 0.8; margin-top: 4px; }
  .filters { background: #f0f4f8; border: 1px solid #d1dce8; border-radius: 4px; padding: 8px 12px; margin: 10px 0; font-size: 10px; }
  .filter-tag { display: inline-block; background: #dbeafe; border-radius: 3px; padding: 2px 7px; margin: 2px 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  thead tr { background: #1e3a5f; color: #fff; }
  thead th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 600; letter-spacing: 0.3px; white-space: nowrap; }
  tbody tr td { padding: 7px 10px; border-bottom: 1px solid #e8edf3; }
  tbody tr.alt td { background: #eff6ff; }
  tbody tr:hover td { background: #dbeafe; }
  .summary { margin-top: 12px; font-size: 10px; color: #555; text-align: right; }
</style>
</head>
<body>
  <div class="header">
    <h1>${this.title}</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>
  ${filterHtml}
  <table>${theadHtml}${tbodyHtml}</table>
  <div class="summary">Total records: ${data.length}</div>
</body>
</html>`;
    }

    private _humanise(key: string): string {
        return key
            .replace(/([A-Z])/g, " $1")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .trim();
    }
}
