import { ApprovalTimeline } from "@/components/billing/ApprovalTimeline";
import {
  BillingEmptyState,
  BillingPageHeader,
} from "@/components/billing/BillingPageChrome";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function BillingApprovalsPage() {
  const user = await requireAuth();

  const approvals = await prisma.billingInvoiceApproval
    .findMany({
      where: { invoice: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        approvalType: true,
        decision: true,
        actorRole: true,
        reason: true,
        decidedAt: true,
        createdAt: true,
        invoice: { select: { invoiceNumber: true, id: true } },
      },
    })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <BillingPageHeader
        title="Approvals"
        description="Participant, provider, and admin approval steps across invoices."
      />

      {approvals.length === 0 ? (
        <BillingEmptyState title="No approvals yet">
          Approval requests appear here when invoices enter review.
        </BillingEmptyState>
      ) : (
        <ApprovalTimeline
          events={approvals.map((a) => ({
            id: a.id,
            approvalType: `${a.approvalType} (${a.invoice.invoiceNumber ?? a.invoice.id.slice(0, 8)})`,
            decision: a.decision,
            actorRole: a.actorRole,
            reason: a.reason,
            decidedAt: a.decidedAt,
            createdAt: a.createdAt,
          }))}
        />
      )}
    </div>
  );
}
