import { notFound } from "next/navigation";

import { PayoutStatusBadge } from "@/components/payouts/PayoutStatusBadge";

export default function PayoutDemoPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const steps = [
    "Create support worker payout recipient",
    "Create provider organisation payout recipient",
    "Complete Stripe onboarding (test mode)",
    "Create care + transport booking payment",
    "Pay through Stripe Checkout test card",
    "Worker submits service note",
    "Participant confirms service",
    "Admin approves payout batch and creates transfers",
    "Export reconciliation CSV",
  ];

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-3xl font-bold">Payout demo (development only)</h1>
      <p>
        Walk through the booking-to-payout lifecycle using Stripe test mode. See{" "}
        <code>docs/payout-demo.md</code> for CLI instructions.
      </p>
      <ol className="list-decimal space-y-2 pl-6">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="flex gap-2">
        <PayoutStatusBadge status="pending_service" />
        <PayoutStatusBadge status="ready" />
        <PayoutStatusBadge status="transfer_created" />
      </div>
    </main>
  );
}
