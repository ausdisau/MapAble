import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { listAuthorisedInvoices } from "@/lib/support/plan-manager/invoice-review-service";

export default async function PlanManagerInvoicesPage() {
  const user = await requirePermission("plan_manager:portal");
  const invoices = await listAuthorisedInvoices(user.id);

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Invoices</h1>
        <Link className="text-primary underline text-sm" href="/plan-manager">
          Back
        </Link>
      </div>
      <p className="text-muted-foreground text-sm">
        Authorised invoices only. Does not submit to NDIA or PACE.
      </p>

      {invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">No authorised invoices.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {invoices.map((inv) => (
            <li key={inv.id} className="p-4">
              <Link
                className="font-medium text-primary underline"
                href={`/plan-manager/invoices/${inv.id}`}
              >
                {inv.invoiceNumber ?? inv.id.slice(0, 8)}
              </Link>
              <p className="text-sm text-muted-foreground">
                {inv.status}
                {"totalCents" in inv && inv.totalCents != null
                  ? ` · $${(Number(inv.totalCents) / 100).toFixed(2)}`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
