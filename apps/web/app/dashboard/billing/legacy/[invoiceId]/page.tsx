import Link from "next/link";

import { BillingPreflightPanel } from "@/components/billing/BillingPreflightPanel";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAuth } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

function formatAud(cents: number, currency: string) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default async function LegacyInvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const user = await requireAuth();
  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lines: true,
      preflightResults: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (
    !invoice ||
    (!isAdminRole(user.primaryRole) && invoice.participantId !== user.id)
  ) {
    return (
      <div className="space-y-4">
        <p role="alert">Invoice not found.</p>
        <Link href="/dashboard/billing/legacy" className="text-sm text-primary">
          Back to legacy drafts
        </Link>
      </div>
    );
  }

  const preflight = invoice.preflightResults[0];
  const failedReasons =
    preflight?.failedReasons &&
    Array.isArray(preflight.failedReasons)
      ? (preflight.failedReasons as string[])
      : undefined;

  const totalCents = invoice.lines.reduce((sum, l) => sum + l.totalAmountCents, 0);

  return (
    <div className="space-y-6">
      <p>
        <Link
          href="/dashboard/billing/legacy"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to legacy drafts
        </Link>
      </p>

      <header className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl font-bold">
          Invoice draft {invoice.id.slice(0, 8)}
        </h1>
        <StatusBadge status={invoice.status} />
      </header>

      <p className="text-sm text-muted-foreground">
        Legacy draft — not an NDIS claim submission. Use the billing centre
        invoices section for Stripe payments.
      </p>

      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-lg font-semibold">{formatAud(totalCents, invoice.currency)}</p>
        <p className="text-sm text-muted-foreground">
          Created {invoice.createdAt.toLocaleString("en-AU")}
        </p>
      </section>

      {preflight ? (
        <BillingPreflightPanel
          status={preflight.status}
          failedReasons={failedReasons}
        />
      ) : null}

      <section>
        <h2 className="font-semibold">Line items</h2>
        <ul className="mt-3 space-y-2">
          {invoice.lines.map((line) => (
            <li key={line.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">{line.description}</p>
              <p className="text-muted-foreground">
                {formatAud(line.totalAmountCents, invoice.currency)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
