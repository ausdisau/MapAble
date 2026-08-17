import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function LegacyInvoiceDraftsPage() {
  const user = await requireAuth();
  const invoices = await prisma.invoice.findMany({
    where: { participantId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Invoice drafts (legacy)</h1>
        <p className="text-sm text-muted-foreground">
          Older invoice draft records from the Phase 2 workflow. For new
          payments and plan-manager exports, use{" "}
          <Link href="/dashboard/billing/invoices" className="text-primary hover:underline">
            invoices & payments
          </Link>
          .
        </p>
      </header>

      {invoices.length === 0 ? (
        <p role="status">You have no legacy invoice drafts.</p>
      ) : (
        <ul className="space-y-3">
          {invoices.map((i) => (
            <li key={i.id}>
              <Link
                href={`/dashboard/billing/legacy/${i.id}`}
                className="flex justify-between rounded-lg border border-border bg-card p-3 hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>Invoice {i.id.slice(0, 8)}</span>
                <StatusBadge status={i.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
