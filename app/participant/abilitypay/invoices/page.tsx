import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Invoice review | AbilityPay" };

export default async function ParticipantAbilityPayInvoicesPage() {
  const participant = await requireAuth();
  const invoices = await prisma.billingInvoice.findMany({
    where: { userId: participant.id },
    include: {
      provider: { select: { name: true } },
      reconciliations: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <section
      aria-labelledby="abilitypay-invoices-heading"
      className="space-y-4"
    >
      <h1
        id="abilitypay-invoices-heading"
        className="font-heading text-3xl font-bold"
      >
        AbilityPay invoice review
      </h1>
      <p className="max-w-3xl text-muted-foreground">
        Review recorded invoice information and differences. MapAble does not
        pay, reject or submit a claim from this screen.
      </p>
      <ul className="space-y-4">
        {invoices.map((invoice) => {
          const reconciliation = invoice.reconciliations[0];
          return (
            <li key={invoice.id} className="rounded-xl border p-4">
              <h2 className="font-bold">
                {invoice.provider?.name ?? "Provider invoice"}
              </h2>
              <p>Invoice {invoice.invoiceNumber ?? invoice.id}</p>
              <p>
                Amount: ${(invoice.totalCents / 100).toFixed(2)}{" "}
                {invoice.currency}
              </p>
              <p>
                Review status:{" "}
                {reconciliation?.overallStatus.replace(/_/g, " ") ??
                  "Not reconciled"}
              </p>
              <p className="text-sm text-muted-foreground">
                Unknown information remains unknown and requires human review.
              </p>
            </li>
          );
        })}
      </ul>
      {!invoices.length ? <p>No invoices are available for review.</p> : null}
    </section>
  );
}
