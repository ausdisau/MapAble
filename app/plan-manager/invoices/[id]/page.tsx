import Link from "next/link";

import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth/guards";
import {
  approveInvoiceForPayment,
  raisePlanManagerQuery,
} from "@/lib/plan-manager/invoice-review-service";
import { prisma } from "@/lib/prisma";

export default async function PlanManagerInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("plan_manager:portal");
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { lines: true },
  });

  if (!invoice) {
    return <p className="p-4">Invoice not found.</p>;
  }

  async function approveAction(formData: FormData) {
    "use server";
    const u = await requirePermission("plan_manager:portal");
    await approveInvoiceForPayment({
      invoiceId: id,
      planManagerId: u.id,
      notes: String(formData.get("notes") ?? ""),
    });
  }

  async function queryAction(formData: FormData) {
    "use server";
    const u = await requirePermission("plan_manager:portal");
    await raisePlanManagerQuery({
      invoiceId: id,
      planManagerId: u.id,
      body: String(formData.get("body") ?? ""),
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <Link className="text-primary underline text-sm" href="/plan-manager/invoices">
        Back to invoices
      </Link>
      <h1 className="font-heading text-2xl font-bold">
        Invoice {invoice.invoiceNumber ?? invoice.id.slice(0, 8)}
      </h1>
      <p className="text-muted-foreground">
        Total: ${(invoice.totalCents / 100).toFixed(2)} (incl. GST $
        {(invoice.taxCents / 100).toFixed(2)})
      </p>

      <section>
        <h2 className="font-medium">Line items</h2>
        <ul className="mt-2 divide-y rounded border text-sm">
          {invoice.lines.map((line) => (
            <li key={line.id} className="p-3">
              {line.description} — ${(line.totalAmountCents / 100).toFixed(2)}
            </li>
          ))}
        </ul>
      </section>

      <form action={approveAction} className="space-y-2 rounded border p-4">
        <h2 className="font-medium">Approve for payment</h2>
        <textarea
          className="w-full rounded border p-2 text-sm"
          name="notes"
          placeholder="Optional notes"
          rows={2}
        />
        <Button type="submit" size="default" variant="default">
          Approve
        </Button>
      </form>

      <form action={queryAction} className="space-y-2 rounded border p-4">
        <h2 className="font-medium">Raise query</h2>
        <textarea
          className="w-full rounded border p-2 text-sm"
          name="body"
          placeholder="Question for participant or provider"
          required
          rows={3}
        />
        <Button type="submit" size="default" variant="outline">
          Send query
        </Button>
      </form>
    </div>
  );
}
