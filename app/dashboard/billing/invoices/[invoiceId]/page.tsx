import Link from "next/link";

import { BillingInvoiceDetailClient } from "@/components/billing/BillingInvoiceDetailClient";
import { requireAuth } from "@/lib/auth/guards";
import { getInvoiceForUser } from "@/lib/billing/core/invoice-service";

export default async function BillingInvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const user = await requireAuth();
  const { invoiceId } = await params;
  const invoice = await getInvoiceForUser(invoiceId, user.id);

  if (!invoice) {
    return (
      <div className="space-y-4">
        <p role="alert">Invoice not found.</p>
        <Link
          href="/dashboard/billing/invoices"
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to invoices
        </Link>
      </div>
    );
  }

  const detail = {
    id: invoice.id,
    status: invoice.status,
    serviceType: invoice.serviceType,
    totalCents: invoice.totalCents,
    currency: invoice.currency,
    dueAt: invoice.dueAt?.toISOString() ?? null,
    createdAt: invoice.createdAt.toISOString(),
    fundingSource: invoice.fundingSource
      ? { label: invoice.fundingSource.label, type: invoice.fundingSource.type }
      : null,
    lineItems: invoice.lineItems.map((line) => ({
      id: line.id,
      description: line.description,
      quantity: Number(line.quantity),
      unitAmountCents: line.unitAmountCents,
      totalAmountCents: line.totalCents,
    })),
    payments: invoice.payments.map((p) => ({
      status: p.status,
      amountCents: p.amountCents,
      createdAt: p.createdAt.toISOString(),
    })),
  };

  return <BillingInvoiceDetailClient invoice={detail} />;
}
