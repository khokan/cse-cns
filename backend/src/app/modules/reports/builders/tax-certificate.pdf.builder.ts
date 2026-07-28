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
            await page.setContent(html, { waitUntil: "networkidle0" });

            const pdfBuffer = await page.pdf({
                format: "A4",
                printBackground: true,
                margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" },
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
    font-family: "Times New Roman", Times, serif;
    font-size: 11pt;
    color: #000;
    background: #fff;
    padding: 10px 5px;
  }

  /* ---- Header ---- */
  .cert-title {
    text-align: center;
    font-size: 17pt;
    font-weight: bold;
    margin-bottom: 4px;
  }
  .cert-subtitle {
    text-align: center;
    font-size: 9.5pt;
    margin-bottom: 14px;
  }
  .ref-row {
    display: flex;
    justify-content: space-between;
    font-size: 10.5pt;
    margin-bottom: 10px;
  }

  /* ---- Info table (01–03) ---- */
  .info-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 18px;
  }
  .info-table td, .info-table th {
    border: 1px solid #000;
    padding: 5px 8px;
  }
  .info-table .num-col { width: 38px; text-align: center; }
  .info-table .label-col { width: 240px; }
  .info-table .value-col { font-weight: normal; }
  .info-table .value-col u { text-decoration: underline; }

  /* ---- Section labels ---- */
  .section-label {
    font-size: 10.5pt;
    margin-bottom: 6px;
    margin-top: 16px;
  }

  /* ---- Data tables ---- */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 18px;
  }
  .data-table th {
    border: 1px solid #000;
    padding: 5px 6px;
    text-align: center;
    font-size: 10.5pt;
    font-weight: bold;
    background: #fff;
    vertical-align: middle;
  }
  .data-table td {
    border: 1px solid #000;
    padding: 4px 6px;
    font-size: 10.5pt;
    vertical-align: middle;
  }
  .data-table .center { text-align: center; }
  .data-table .right  { text-align: right; }

  /* Total row */
  .data-table .total-row td {
    font-weight: bold;
  }

  /* ---- Footer ---- */
  .footer-note {
    font-size: 10pt;
    margin-top: 20px;
    line-height: 1.6;
  }
</style>
</head>
<body>

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
      <td class="value-col"><u>${cert.trecHolder.name}</u></td>
    </tr>
    <tr>
      <td class="num-col">02</td>
      <td class="label-col">Address</td>
      <td class="value-col"><u>${cert.trecHolder.address}</u></td>
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
        <th style="width:30px;">Sl.</th>
        <th style="width:90px;">Month of<br/>Collection</th>
        <th>Description of<br/>Collection Tax</th>
        <th style="width:95px;">Applicable Section</th>
        <th style="width:120px;">Trade Volume (Tk.)</th>
        <th style="width:100px;">Income Tax<br/>(Tk.)</th>
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
        <th style="width:30px;">Sl.</th>
        <th style="width:145px;">Challan Number</th>
        <th style="width:70px;">Challan<br/>Date</th>
        <th style="width:80px;">Month</th>
        <th style="width:120px;">Bank &amp; Branch</th>
        <th style="width:110px;">Total Amount<br/>In Challan</th>
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
