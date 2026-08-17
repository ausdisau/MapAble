"use client";

import { useEffect, useState } from "react";

import { PayoutBlockerList } from "@/components/payouts/PayoutBlockerList";
import { PayoutRecipientStatusCard } from "@/components/payouts/PayoutRecipientStatusCard";
import { PayoutSummaryCard } from "@/components/payouts/PayoutSummaryCard";
import { TransferList } from "@/components/payouts/TransferList";

type PayoutData = {
  recipient: {
    id: string;
    displayName: string;
    stripeOnboardingStatus: string;
  } | null;
  splits: Array<{
    id: string;
    status: string;
    netTransferCents: number | null;
    amountCents: number;
    blockReason: string | null;
    payment: { currency: string };
  }>;
};

export default function WorkerPayoutsPage() {
  const [data, setData] = useState<PayoutData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/payouts")
      .then((r) => r.json())
      .then((json) => {
        if (json.recipient !== undefined || json.splits) setData(json);
        else setError(json.error ?? "Unable to load payouts");
      })
      .catch(() => setError("Unable to load payouts"));
  }, []);

  const pending = data?.splits.filter((s) =>
    ["pending_service", "ready", "blocked"].includes(s.status)
  );
  const transferred = data?.splits.filter((s) =>
    ["transfer_created", "transferred"].includes(s.status)
  );
  const pendingTotal =
    pending?.reduce((sum, s) => sum + (s.netTransferCents ?? s.amountCents), 0) ?? 0;

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <header>
        <h1 className="text-3xl font-bold">Your payouts</h1>
        <p className="mt-2 text-sm">
          Your payout is connected to a completed service record. MapAble releases transfers after the
          service is recorded, any required confirmation is complete, and no dispute or safety review
          is open.
        </p>
      </header>

      {error ? (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      ) : null}

      {data?.recipient ? (
        <PayoutRecipientStatusCard
          displayName={data.recipient.displayName}
          statusLabel={data.recipient.stripeOnboardingStatus.replace(/_/g, " ")}
          statusDescription="Complete Stripe setup to receive transfers."
          onboardingStatus={data.recipient.stripeOnboardingStatus}
          nextAction={
            data.recipient.stripeOnboardingStatus !== "enabled"
              ? "Complete Stripe onboarding"
              : undefined
          }
        />
      ) : null}

      <PayoutSummaryCard
        title="Pending confirmation or transfer"
        amountCents={pendingTotal}
        description="Estimated amounts until service confirmation and transfer."
      />

      <PayoutBlockerList
        blockers={
          data?.splits
            .filter((s) => s.blockReason)
            .map((s) => s.blockReason as string) ?? []
        }
      />

      <section aria-labelledby="transfers-heading">
        <h2 id="transfers-heading" className="text-lg font-semibold">
          Transfers
        </h2>
        <TransferList
          transfers={(transferred ?? []).map((s) => ({
            id: s.id,
            amountCents: s.netTransferCents ?? s.amountCents,
            currency: s.payment.currency,
            status: s.status,
            createdAt: new Date().toISOString(),
          }))}
        />
      </section>
    </main>
  );
}
