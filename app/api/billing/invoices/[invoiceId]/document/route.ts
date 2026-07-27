import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError } from "@/lib/api/response";
import {
  BillingAccessError,
} from "@/lib/billing/access";
import { isResponse } from "@/lib/billing/api-helpers";
import { writeFinancialAudit } from "@/lib/billing/audit/financial-audit";
import {
  renderInvoiceHtml,
  renderInvoiceTaggedPdf,
} from "@/lib/billing/invoicing/invoice-document";
import { loadInvoiceDocumentForUser } from "@/lib/billing/invoicing/load-invoice-document";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireApiSession();
  if (isResponse(user)) return user;

  const { invoiceId } = await params;
  const format = new URL(req.url).searchParams.get("format") ?? "html";

  try {
    const doc = await loadInvoiceDocumentForUser(user, invoiceId);

    await writeFinancialAudit({
      organisationId: null,
      actorId: user.id,
      actorRole: user.primaryRole,
      action: "invoice_document_exported",
      entityType: "BillingInvoice",
      entityId: invoiceId,
      newValues: { format, invoiceNumber: doc.invoiceNumber },
      reason: "Invoice document download",
    });

    if (format === "pdf") {
      const pdf = renderInvoiceTaggedPdf(doc);
      return new Response(new Uint8Array(pdf), {
        status: 200,
        headers: {
          "content-type": "application/pdf",
          "content-disposition": `attachment; filename="${doc.invoiceNumber}.pdf"`,
          "cache-control": "no-store",
        },
      });
    }

    const html = renderInvoiceHtml(doc);
    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-disposition": `inline; filename="${doc.invoiceNumber}.html"`,
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof BillingAccessError) {
      return jsonError(e.message, e.status);
    }
    return jsonError(
      e instanceof Error ? e.message : "Document generation failed",
      400
    );
  }
}
