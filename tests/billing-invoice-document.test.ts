import { describe, expect, it } from "vitest";

import {
  renderInvoiceHtml,
  renderInvoiceTaggedPdf,
  type InvoiceDocumentModel,
} from "@/lib/billing/invoicing/invoice-document";

const sample: InvoiceDocumentModel = {
  invoiceNumber: "MAP-DOC-1",
  status: "issued",
  issueDate: new Date("2026-07-10"),
  dueDate: new Date("2026-07-24"),
  currency: "AUD",
  legalEntityName: "MapAble Australia",
  tradingName: "MapAble",
  abn: "51824753556",
  providerName: "Demo Care Org",
  recipientName: "Alex Participant",
  participantDisplayRef: "P-****01",
  fundingLabel: "Plan managed",
  lines: [
    {
      description: "Assistance with self-care",
      serviceDate: new Date("2026-07-10"),
      supportItemCode: "01_011_0107_1_1",
      quantity: 2,
      unit: "hour",
      unitAmountCents: 6706,
      totalCents: 13412,
    },
  ],
  subtotalCents: 13412,
  platformFeeCents: 0,
  gstCents: 0,
  coPaymentCents: 0,
  creditCents: 0,
  totalCents: 13412,
  amountPaidCents: 0,
};

describe("invoice document rendering", () => {
  it("renders tagged HTML with caption and lang", () => {
    const html = renderInvoiceHtml(sample);
    expect(html).toContain('lang="en-AU"');
    expect(html).toContain("<caption>");
    expect(html).toContain('scope="col"');
    expect(html).toContain("MAP-DOC-1");
    expect(html).toContain("Platform fee");
  });

  it("renders tagged PDF with MarkInfo and struct tree", () => {
    const pdf = renderInvoiceTaggedPdf(sample);
    const text = pdf.toString("latin1");
    expect(text.startsWith("%PDF-1.7")).toBe(true);
    expect(text).toContain("/MarkInfo");
    expect(text).toContain("/StructTreeRoot");
    expect(text).toContain("/Lang (en-AU)");
    expect(text).toContain("%%EOF");
  });
});
