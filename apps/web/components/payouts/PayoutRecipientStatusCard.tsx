import { PayoutStatusBadge } from "@/components/payouts/PayoutStatusBadge";

export function PayoutRecipientStatusCard({
  displayName,
  statusLabel,
  statusDescription,
  onboardingStatus,
  nextAction,
}: {
  displayName: string;
  statusLabel: string;
  statusDescription: string;
  onboardingStatus: string;
  nextAction?: string;
}) {
  return (
    <section className="rounded-lg border p-6" aria-labelledby="payout-setup-heading">
      <h1 id="payout-setup-heading" className="text-2xl font-bold">
        Payout setup
      </h1>
      <p className="mt-2 text-sm">
        Stripe handles identity verification and payout details. MapAble does not store your bank
        account number.
      </p>
      <div className="mt-4">
        <p className="font-medium">{displayName}</p>
        <div className="mt-2 flex items-center gap-2">
          <PayoutStatusBadge status={onboardingStatus} />
          <span>{statusLabel}</span>
        </div>
        <p className="mt-2 text-sm">{statusDescription}</p>
        {nextAction ? (
          <p className="mt-3 font-medium" role="status">
            Next step: {nextAction}
          </p>
        ) : null}
      </div>
    </section>
  );
}
