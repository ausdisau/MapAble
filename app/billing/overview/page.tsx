import Link from "next/link";

import { FinanceKpiGrid } from "@/components/billing/FinanceKpiGrid";
import { BillingPageHeader } from "@/components/billing/BillingPageChrome";
import { requireAuth } from "@/lib/auth/guards";
import { computeBillingOverviewKpis } from "@/lib/billing/overview/kpis";
import { mapableSectionCardClass } from "@/lib/brand/styles";
import type { BillingOverviewKpis } from "@/types/billing";

const EMPTY_KPIS: BillingOverviewKpis = {
  draftInvoiceCents: 0,
  readyToIssueCents: 0,
  issuedThisMonthCents: 0,
  cashCollectedCents: 0,
  overdueCents: 0,
  disputedCents: 0,
  unbilledCompletedServicesCents: 0,
  unreconciledPaymentsCents: 0,
  claimRejectionRateBps: 0,
  averageDaysToPayment: null,
  providerPayoutsDueCents: 0,
  subscriptionRevenueCents: 0,
  revenueByVertical: [],
};

export default async function BillingOverviewPage() {
  const user = await requireAuth();
  const kpis = await computeBillingOverviewKpis({
    participantId: user.id,
  }).catch(() => EMPTY_KPIS);

  const items = [
    {
      id: "draft",
      label: "Draft invoices",
      value: kpis.draftInvoiceCents,
      kind: "money" as const,
      statusLabel: "Not yet shared",
    },
    {
      id: "ready",
      label: "Ready to issue",
      value: kpis.readyToIssueCents,
      kind: "money" as const,
    },
    {
      id: "issued",
      label: "Issued this month",
      value: kpis.issuedThisMonthCents,
      kind: "money" as const,
    },
    {
      id: "cash",
      label: "Cash collected",
      value: kpis.cashCollectedCents,
      kind: "money" as const,
      statusLabel: "Received",
    },
    {
      id: "overdue",
      label: "Overdue",
      value: kpis.overdueCents,
      kind: "money" as const,
      statusLabel: kpis.overdueCents > 0 ? "Needs follow-up" : "Clear",
    },
    {
      id: "disputed",
      label: "Disputed",
      value: kpis.disputedCents,
      kind: "money" as const,
      statusLabel: "Under review",
    },
    {
      id: "unbilled",
      label: "Unbilled completed services",
      value: kpis.unbilledCompletedServicesCents,
      kind: "money" as const,
    },
    {
      id: "unreconciled",
      label: "Unreconciled payments",
      value: kpis.unreconciledPaymentsCents,
      kind: "money" as const,
    },
    {
      id: "rejection",
      label: "Claim rejection rate",
      value: kpis.claimRejectionRateBps,
      kind: "bps" as const,
    },
    {
      id: "days",
      label: "Average days to payment",
      value: kpis.averageDaysToPayment ?? 0,
      kind: "days" as const,
      hint:
        kpis.averageDaysToPayment == null
          ? "Not enough paid invoices yet"
          : undefined,
    },
    {
      id: "payouts",
      label: "Provider payouts due",
      value: kpis.providerPayoutsDueCents,
      kind: "money" as const,
    },
    {
      id: "subs",
      label: "Subscription revenue",
      value: kpis.subscriptionRevenueCents,
      kind: "money" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <BillingPageHeader
        title="Billing overview"
        description="Finance snapshot across invoices, collections, claims, and payouts. Figures use Australian dollars."
      />

      <FinanceKpiGrid items={items} />

      <section
        aria-labelledby="quick-links-heading"
        className={`${mapableSectionCardClass} p-5`}
      >
        <h2
          id="quick-links-heading"
          className="text-lg font-black text-[#0C1833]"
        >
          Common workspaces
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: "/billing/invoices", label: "Invoices" },
            { href: "/billing/approvals", label: "Approvals" },
            { href: "/billing/payments", label: "Payments" },
            { href: "/billing/claims", label: "Claims (simulated)" },
            { href: "/billing/disputes", label: "Disputes" },
            { href: "/billing/reconciliation", label: "Reconciliation" },
          ].map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#005B7F] hover:bg-[#F6FBFC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
