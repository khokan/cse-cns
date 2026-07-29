import puppeteer from "puppeteer";
import { ReportBuilder, BuildResult } from "./base.builder.js";
import type { TaxCertificateData } from "./tax-certificate.types.js";

// ---------------------------------------------------------------------------
// Tax Certificate PDF Builder
// Renders the "Certificate of Collection of Tax" using Puppeteer,
// matching the layout from the attached reference image exactly.
// ---------------------------------------------------------------------------

export class TaxCertificatePdfBuilder extends ReportBuilder {
    readonly title = "Certificate of Collection of Tax";

    async generate(
        data: Record<string, unknown>[],
        _filters?: Record<string, unknown>
    ): Promise<BuildResult> {
        // The worker passes the TaxCertificateData as the first element
        const certData = data[0] as unknown as TaxCertificateData;
        const html = buildCertificateHtml(certData);

        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: "domcontentloaded" });

            const pdfBuffer = await page.pdf({
                format: "A4",
                printBackground: true,
                margin: { top: "35mm", bottom: "12mm", left: "15mm", right: "12mm" },
                displayHeaderFooter: false,
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
}

// ---------------------------------------------------------------------------
// HTML template builder — matches the reference certificate image
// ---------------------------------------------------------------------------
function buildCertificateHtml(cert: TaxCertificateData): string {
    const collectionRows = cert.collectionRows
        .map(
            (r) => `
        <tr>
            <td class="center">${r.sl}</td>
            <td>${r.monthLabel}</td>
            <td>${r.description}</td>
            <td class="center">${r.section}</td>
            <td class="right">${r.tradeVolume}</td>
            <td class="right">${r.incomeTax}</td>
        </tr>`
        )
        .join("");

    const challanRows = cert.challanRows
        .map(
            (r) => `
        <tr>
            <td class="center">${r.sl}.</td>
            <td>${r.challanNumber}</td>
            <td class="center">${r.challanDate}</td>
            <td class="center">${r.month}</td>
            <td>${r.bankBranch}</td>
            <td class="right">${r.totalAmount}</td>
        </tr>`
        )
        .join("");

    const totalTradeVolume = cert.collectionRows
        .reduce((sum, r) => sum + (parseFloat(String(r.tradeVolume).replace(/,/g, "")) || 0), 0)
        .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const totalIncomeTax = cert.collectionRows
        .reduce((sum, r) => sum + (parseFloat(String(r.incomeTax).replace(/,/g, "")) || 0), 0)
        .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: 9pt;
    color: #1a1a2e;
    background: #fff;
  }

  /* ---- Accent bar ---- */
  .accent-bar {
    height: 1px;
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
    margin-bottom: 10px;
  }

  /* ---- Header ---- */
  .cert-title {
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
    color: #1a1a2e;
    margin-bottom: 2px;
  }
  .cert-subtitle {
    text-align: center;
    font-size: 8pt;
    color: #667085;
    margin-bottom: 8px;
  }
  .ref-row {
    display: flex;
    justify-content: space-between;
    font-size: 9pt;
    margin-bottom: 8px;
    color: #344054;
  }

  /* ---- Info table (01–03) ---- */
  .info-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    border-radius: 2px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0,0,0,0.06);
  }
  .info-table td {
    border: 1px solid #d0d5dd;
    padding: 3px 6px;
    font-size: 9pt;
  }
  .info-table .num-col {
    width: 32px;
    text-align: center;
    background: #f0f4f8;
    color: #475467;
    font-weight: bold;
  }
  .info-table .label-col {
    width: 200px;
    background: #f8f9fb;
    color: #344054;
  }
  .info-table .value-col { font-weight: normal; }

  /* ---- Section labels ---- */
  .section-label {
    font-size: 9pt;
    margin-bottom: 4px;
    margin-top: 8px;
    color: #344054;
    font-weight: bold;
  }

  /* ---- Data tables ---- */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    border-radius: 2px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0,0,0,0.06);
  }
  .data-table th {
    border: 1px solid #d0d5dd;
    padding: 3px 4px;
    text-align: center;
    font-size: 8.5pt;
    font-weight: bold;
    background: #f0f4f8;
    color: #344054;
    vertical-align: middle;
  }
  .data-table td {
    border: 1px solid #d0d5dd;
    padding: 2px 4px;
    font-size: 8.5pt;
    vertical-align: middle;
  }
  .data-table .center { text-align: center; }
  .data-table .right  { text-align: right; }

  /* Alternating row tint */
  .data-table tbody tr:nth-child(even) { background: #f9fafb; }

  /* Total row */
  .data-table .total-row td {
    font-weight: bold;
    background: #f0f4f8;
    border-top: 2px solid #b0b8c4;
  }

  /* ---- Footer ---- */
  .footer-note {
    font-size: 8pt;
    margin-top: 10px;
    line-height: 1.5;
    color: #667085;
    font-style: italic;
  }
</style>
</head>
<body>

  <div class="accent-bar"></div>

  <p class="cert-title">Certificate of Collection of Tax</p>
  <p class="cert-subtitle">[Section 145(1) of the Income Tax Act, 2023]</p>

  <div class="ref-row">
    <span>${cert.referenceNumber}</span>
    <span>${cert.issueDate}</span>
  </div>

  <!-- Holder Info -->
  <table class="info-table">
    <tr>
      <td class="num-col">01</td>
      <td class="label-col">Name of TREC Holder &amp; TREC No.</td>
      <td class="value-col">${cert.trecHolder.name}</td>
    </tr>
    <tr>
      <td class="num-col">02</td>
      <td class="label-col">Address</td>
      <td class="value-col">${cert.trecHolder.address}</td>
    </tr>
    <tr>
      <td class="num-col">03</td>
      <td class="label-col">Twelve-digit TIN</td>
      <td class="value-col">${cert.trecHolder.tin}</td>
    </tr>
  </table>

  <!-- Section 04 -->
  <p class="section-label">04. Particulars of collection of Tax</p>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width:26px;">Sl.</th>
        <th style="width:72px;">Month of<br/>Collection</th>
        <th>Description of<br/>Collection Tax</th>
        <th style="width:78px;">Applicable Section</th>
        <th style="width:100px;">Trade Volume (Tk.)</th>
        <th style="width:82px;">Income Tax<br/>(Tk.)</th>
      </tr>
    </thead>
    <tbody>
      ${collectionRows}
      <tr class="total-row">
        <td colspan="4" class="center"><strong>Total</strong></td>
        <td class="right"><strong>${totalTradeVolume}</strong></td>
        <td class="right"><strong>${totalIncomeTax}</strong></td>
      </tr>
    </tbody>
  </table>

  <!-- Section 05 -->
  <p class="section-label">05. Payment of collected tax to the credit of the Government</p>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width:26px;">Sl.</th>
        <th style="width:120px;">Challan Number</th>
        <th style="width:60px;">Challan<br/>Date</th>
        <th style="width:68px;">Month</th>
        <th style="width:100px;">Bank &amp; Branch</th>
        <th style="width:90px;">Total Amount<br/>In Challan</th>
      </tr>
    </thead>
    <tbody>
      ${challanRows}
    </tbody>
  </table>

  <!-- Footer -->
  <p class="footer-note">
    This is a system-generated certificate issued by Chittagong Stock Exchange PLC based on C&amp;S records.
    No signature or seal is required.
  </p>

</body>
</html>`;
}
