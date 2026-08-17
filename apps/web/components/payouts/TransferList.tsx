import { PayoutStatusBadge } from "@/components/payouts/PayoutStatusBadge";

type TransferRow = {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  recipientName?: string;
  createdAt: string;
};

export function TransferList({ transfers }: { transfers: TransferRow[] }) {
  if (!transfers.length) {
    return <p role="status">No transfers yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm" aria-label="Payout transfers">
        <caption className="sr-only">List of payout transfers to your connected account</caption>
        <thead>
          <tr>
            <th scope="col" className="px-3 py-2">
              Date
            </th>
            <th scope="col" className="px-3 py-2">
              Recipient
            </th>
            <th scope="col" className="px-3 py-2">
              Amount
            </th>
            <th scope="col" className="px-3 py-2">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((t) => (
            <tr key={t.id} className="border-t">
              <td className="px-3 py-2">
                {new Date(t.createdAt).toLocaleDateString("en-AU")}
              </td>
              <td className="px-3 py-2">{t.recipientName ?? "—"}</td>
              <td className="px-3 py-2">
                {new Intl.NumberFormat("en-AU", {
                  style: "currency",
                  currency: t.currency,
                }).format(t.amountCents / 100)}
              </td>
              <td className="px-3 py-2">
                <PayoutStatusBadge status={t.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
