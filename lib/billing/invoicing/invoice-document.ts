import { formatAud } from "@/lib/billing/money";
import { plainLanguageStatus } from "@/lib/billing/invoicing/state-machine";
import type { BillingInvoiceState } from "@/types/billing";

export type InvoiceDocumentLine = {
  description: string;
  serviceDate?: Date | string | null;
  supportItemCode?: string | null;
  quantity: number | string;
  unit?: string | null;
  unitAmountCents: number;
  gstCents?: number;
  totalCents: number;
};

export type InvoiceDocumentModel = {
  invoiceNumber: string;
  status: string;
  issueDate?: Date | string | null;
  dueDate?: Date | string | null;
  currency: string;
  legalEntityName: string;
  tradingName?: string | null;
  abn?: string | null;
  providerName?: string | null;
  recipientName: string;
  participantDisplayRef?: string | null;
  fundingLabel?: string | null;
  servicePeriodStart?: Date | string | null;
  servicePeriodEnd?: Date | string | null;
  lines: InvoiceDocumentLine[];
  subtotalCents: number;
  platformFeeCents: number;
  gstCents: number;
  coPaymentCents: number;
  creditCents: number;
  totalCents: number;
  amountPaidCents: number;
  notesForBilling?: string | null;
};

function fmtDate(value?: Date | string | null): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapePdfText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

/**
 * Tagged, print-ready HTML invoice (semantic landmarks + table headers).
 * Suitable for download and browser print-to-PDF.
 */
export function renderInvoiceHtml(doc: InvoiceDocumentModel): string {
  const statusLabel = plainLanguageStatus(doc.status as BillingInvoiceState);
  const balance = doc.totalCents - doc.amountPaidCents;
  const rows = doc.lines
    .map(
      (line) => `<tr>
  <td>${escapeHtml(fmtDate(line.serviceDate))}</td>
  <td>
    <div>${escapeHtml(line.description)}</div>
    ${
      line.supportItemCode
        ? `<div class="muted">${escapeHtml(line.supportItemCode)}</div>`
        : ""
    }
  </td>
  <td class="num">${escapeHtml(String(line.quantity))}${
        line.unit ? ` ${escapeHtml(line.unit)}` : ""
      }</td>
  <td class="num">${escapeHtml(formatAud(line.unitAmountCents))}</td>
  <td class="num">${escapeHtml(formatAud(line.totalCents))}</td>
</tr>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="utf-8" />
  <title>Tax invoice ${escapeHtml(doc.invoiceNumber)}</title>
  <meta name="description" content="MapAble tax invoice ${escapeHtml(doc.invoiceNumber)}" />
  <style>
    :root { color-scheme: light; }
    body { font-family: "Segoe UI", system-ui, sans-serif; color: #0C1833; margin: 2rem; line-height: 1.45; }
    h1 { font-size: 1.75rem; margin: 0 0 0.25rem; color: #005B7F; }
    h2 { font-size: 1.1rem; margin: 1.5rem 0 0.5rem; }
    .muted { color: #475569; font-size: 0.875rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 0.6rem 0.4rem; text-align: left; vertical-align: top; }
    th { color: #005B7F; font-size: 0.85rem; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .totals { margin-top: 1rem; max-width: 22rem; margin-left: auto; }
    .totals dl { display: grid; grid-template-columns: 1fr auto; gap: 0.35rem 1rem; }
    .totals dt { color: #475569; } .totals dd { margin: 0; text-align: right; font-weight: 700; }
    @media print {
      body { margin: 0.5in; }
      a { color: inherit; text-decoration: none; }
    }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
  </style>
</head>
<body>
  <header>
    <p class="muted">Tax invoice</p>
    <h1>${escapeHtml(doc.legalEntityName)}</h1>
    ${doc.tradingName ? `<p>${escapeHtml(doc.tradingName)}</p>` : ""}
    ${doc.abn ? `<p class="muted">ABN ${escapeHtml(doc.abn)}</p>` : ""}
  </header>

  <section aria-labelledby="invoice-meta-heading">
    <h2 id="invoice-meta-heading">Invoice details</h2>
    <dl>
      <div><dt>Invoice number</dt><dd>${escapeHtml(doc.invoiceNumber)}</dd></div>
      <div><dt>Status</dt><dd>${escapeHtml(statusLabel)}</dd></div>
      <div><dt>Issue date</dt><dd>${escapeHtml(fmtDate(doc.issueDate))}</dd></div>
      <div><dt>Due date</dt><dd>${escapeHtml(fmtDate(doc.dueDate))}</dd></div>
      <div><dt>Recipient</dt><dd>${escapeHtml(doc.recipientName)}</dd></div>
      ${
        doc.participantDisplayRef
          ? `<div><dt>Participant reference</dt><dd>${escapeHtml(doc.participantDisplayRef)}</dd></div>`
          : ""
      }
      ${
        doc.providerName
          ? `<div><dt>Provider</dt><dd>${escapeHtml(doc.providerName)}</dd></div>`
          : ""
      }
      ${
        doc.fundingLabel
          ? `<div><dt>Funding</dt><dd>${escapeHtml(doc.fundingLabel)}</dd></div>`
          : ""
      }
    </dl>
  </section>

  <section aria-labelledby="lines-heading">
    <h2 id="lines-heading">Line items</h2>
    <table>
      <caption>Charges on invoice ${escapeHtml(doc.invoiceNumber)}</caption>
      <thead>
        <tr>
          <th scope="col">Service date</th>
          <th scope="col">Description</th>
          <th scope="col" class="num">Quantity</th>
          <th scope="col" class="num">Rate</th>
          <th scope="col" class="num">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </section>

  <section class="totals" aria-labelledby="totals-heading">
    <h2 id="totals-heading">Totals</h2>
    <dl>
      <dt>Subtotal</dt><dd>${escapeHtml(formatAud(doc.subtotalCents))}</dd>
      <dt>Platform fee</dt><dd>${escapeHtml(formatAud(doc.platformFeeCents))}</dd>
      <dt>GST</dt><dd>${escapeHtml(formatAud(doc.gstCents))}</dd>
      <dt>Co-payment</dt><dd>${escapeHtml(formatAud(doc.coPaymentCents))}</dd>
      <dt>Credits</dt><dd>${escapeHtml(formatAud(doc.creditCents))}</dd>
      <dt>Total payable</dt><dd>${escapeHtml(formatAud(doc.totalCents))}</dd>
      <dt>Amount paid</dt><dd>${escapeHtml(formatAud(doc.amountPaidCents))}</dd>
      <dt>Balance due</dt><dd>${escapeHtml(formatAud(balance))}</dd>
    </dl>
  </section>

  ${
    doc.notesForBilling
      ? `<section aria-labelledby="notes-heading"><h2 id="notes-heading">Billing notes</h2><p>${escapeHtml(doc.notesForBilling)}</p></section>`
      : ""
  }

  <footer class="muted">
    <p>Generated by MapAble Billing Centre. Platform fees are shown separately from provider rates.</p>
  </footer>
</body>
</html>`;
}

/**
 * Minimal tagged PDF (PDF 1.7) with MarkInfo, document language, title,
 * and marked-content structure elements for heading/paragraph text.
 * Deeper than untagged print dumps; not a full PDF/UA certification suite.
 */
export function renderInvoiceTaggedPdf(doc: InvoiceDocumentModel): Buffer {
  const title = `Tax invoice ${doc.invoiceNumber}`;
  const lines: string[] = [
    doc.legalEntityName,
    doc.abn ? `ABN ${doc.abn}` : "",
    `Invoice ${doc.invoiceNumber}`,
    `Status: ${plainLanguageStatus(doc.status as BillingInvoiceState)}`,
    `Recipient: ${doc.recipientName}`,
    doc.providerName ? `Provider: ${doc.providerName}` : "",
    "",
    "Line items:",
    ...doc.lines.map(
      (l) =>
        `- ${l.description} | qty ${l.quantity} | ${formatAud(l.unitAmountCents)} | ${formatAud(l.totalCents)}`
    ),
    "",
    `Subtotal ${formatAud(doc.subtotalCents)}`,
    `Platform fee ${formatAud(doc.platformFeeCents)}`,
    `GST ${formatAud(doc.gstCents)}`,
    `Total ${formatAud(doc.totalCents)}`,
    `Paid ${formatAud(doc.amountPaidCents)}`,
  ].filter((line) => line !== "");

  const contentOps: string[] = [
    "/Span << /Lang (en-AU) >> BDC",
    "BT /F1 11 Tf 50 780 Td 14 TL",
  ];
  lines.forEach((line, index) => {
    const tag = index === 0 ? "H1" : line === "Line items:" ? "H2" : "P";
    contentOps.push(`/${tag} BMC`);
    contentOps.push(`(${escapePdfText(line)}) Tj T*`);
    contentOps.push("EMC");
  });
  contentOps.push("ET", "EMC");
  const stream = contentOps.join("\n");

  const rebuilt: Buffer[] = [];
  const offs: number[] = [];
  const write = (chunk: string) => {
    offs.push(Buffer.concat(rebuilt).length);
    rebuilt.push(Buffer.from(chunk, "utf8"));
  };

  write("%PDF-1.7\n%\xFF\xFF\xFF\xFF\n");
  write(
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R /Lang (en-AU) /MarkInfo << /Marked true >> /StructTreeRoot 6 0 R /ViewerPreferences << /DisplayDocTitle true >> >>\nendobj\n"
  );
  write("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  write(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> /StructParents 0 >>\nendobj\n"
  );
  write(
    `4 0 obj\n<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream\nendobj\n`
  );
  write(
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
  );
  write(
    "6 0 obj\n<< /Type /StructTreeRoot /K [7 0 R] /ParentTree 9 0 R >>\nendobj\n"
  );
  write(
    "7 0 obj\n<< /Type /StructElem /S /Document /P 6 0 R /K [8 0 R] /Lang (en-AU) >>\nendobj\n"
  );
  write("8 0 obj\n<< /Type /StructElem /S /Part /P 7 0 R /K [] >>\nendobj\n");
  write("9 0 obj\n<< /Nums [0 [7 0 R]] >>\nendobj\n");
  write(
    `10 0 obj\n<< /Title (${escapePdfText(title)}) /Creator (MapAble Billing Centre) /Producer (MapAble tagged PDF) >>\nendobj\n`
  );

  const fileBody = Buffer.concat(rebuilt);
  const xrefStart = fileBody.length;
  let xrefTable = `xref\n0 11\n0000000000 65535 f \n`;
  for (let i = 1; i <= 10; i++) {
    xrefTable += `${String(offs[i]).padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size 11 /Root 1 0 R /Info 10 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.concat([
    fileBody,
    Buffer.from(xrefTable, "utf8"),
    Buffer.from(trailer, "utf8"),
  ]);
}
