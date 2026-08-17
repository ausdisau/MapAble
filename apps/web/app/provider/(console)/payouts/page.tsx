"use client";

import { useEffect, useState } from "react";

import { PayoutRecipientStatusCard } from "@/components/payouts/PayoutRecipientStatusCard";
import { TransferList } from "@/components/payouts/TransferList";

export default function ProviderPayoutsPage() {
  const [data, setData] = useState<{
    recipient: { id: string; displayName: string; stripeOnboardingStatus: string } | null;
    splits: Array<{
      id: string;
      status: string;
      netTransferCents: number | null;
      amountCents: number;
      payment: { currency: string };
      payoutRecipient: { displayName: string } | null;
    }>;
  } | null>(null);

  useEffect(() => {
    fetch("/api/payouts").then((r) => r.json()).then((json) => {
      if (json.splits) setData(json);
    });
  }, []);

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <h1 className="text-3xl font-bold">Organisation payouts</h1>
      <p className="text-sm">
        MapAble may pay your organisation directly or pay workers through your organisation depending
        on your service model.
      </p>

      {data?.recipient ? (
        <PayoutRecipientStatusCard
          displayName={data.recipient.displayName}
          statusLabel={data.recipient.stripeOnboardingStatus}
          statusDescription="Manage payout details in Stripe."
          onboardingStatus={data.recipient.stripeOnboardingStatus}
        />
      ) : (
        <p>Set up organisation payouts via Stripe Connect.</p>
      )}

      <TransferList
        transfers={(data?.splits ?? []).map((s) => ({
          id: s.id,
          amountCents: s.netTransferCents ?? s.amountCents,
          currency: s.payment.currency,
          status: s.status,
          recipientName: s.payoutRecipient?.displayName,
          createdAt: new Date().toISOString(),
        }))}
      />
    </main>
  );
}
