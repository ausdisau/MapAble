"use client";

import { useEffect, useState } from "react";

import { PayoutBlockerList } from "@/components/payouts/PayoutBlockerList";
import { PayoutStatusBadge } from "@/components/payouts/PayoutStatusBadge";

type QueueItem = {
  id: string;
  status: string;
  netTransferCents: number | null;
  amountCents: number;
  blockReason: string | null;
  payment: {
    id: string;
    invoice: {
      bookingId: string | null;
      invoiceNumber: string | null;
    } | null;
  };
  payoutRecipient: { displayName: string } | null;
};

export default function AdminPayoutsPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/payouts?scope=admin")
      .then((r) => r.json())
      .then((json) => setQueue(json.queue ?? []));
  }, []);

  async function processSplit(splitId: string) {
    if (!confirm("Create Stripe transfer for this payout split?")) return;
    const res = await fetch(`/api/payouts/splits/${splitId}/transfer`, { method: "POST" });
    const json = await res.json();
    setMessage(json.transfer ? "Transfer created." : json.error ?? "Transfer failed");
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-3xl font-bold">Payout operations</h1>
      {message ? (
        <p role="status" aria-live="polite">
          {message}
        </p>
      ) : null}

      <table className="min-w-full text-sm" aria-label="Payout queue">
        <caption className="sr-only">Admin payout queue</caption>
        <thead>
          <tr>
            <th scope="col" className="px-2 py-2 text-left">
              Booking
            </th>
            <th scope="col" className="px-2 py-2 text-left">
              Recipient
            </th>
            <th scope="col" className="px-2 py-2 text-left">
              Amount
            </th>
            <th scope="col" className="px-2 py-2 text-left">
              Status
            </th>
            <th scope="col" className="px-2 py-2 text-left">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {queue.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="px-2 py-2">
                {item.payment.invoice?.invoiceNumber ?? item.payment.invoice?.bookingId ?? "—"}
              </td>
              <td className="px-2 py-2">{item.payoutRecipient?.displayName ?? "—"}</td>
              <td className="px-2 py-2">
                ${((item.netTransferCents ?? item.amountCents) / 100).toFixed(2)} AUD
              </td>
              <td className="px-2 py-2">
                <PayoutStatusBadge status={item.status} />
              </td>
              <td className="px-2 py-2">
                {item.status === "ready" ? (
                  <button
                    type="button"
                    className="rounded border px-2 py-1"
                    onClick={() => processSplit(item.id)}
                  >
                    Transfer
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <PayoutBlockerList
        blockers={queue.filter((q) => q.blockReason).map((q) => q.blockReason as string)}
      />
    </main>
  );
}
