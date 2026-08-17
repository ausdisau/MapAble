export function PricingTransparencyPanel({
  lineItems,
  platformFeeCents,
  totalCents,
  fundingSourceLabel,
  currency = "AUD",
}: {
  lineItems: Array<{ description: string; totalCents: number }>;
  platformFeeCents: number;
  totalCents: number;
  fundingSourceLabel: string;
  currency?: string;
}) {
  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(cents / 100);

  return (
    <section
      className="rounded-lg border p-4"
      aria-labelledby="pricing-transparency-heading"
    >
      <h2 id="pricing-transparency-heading" className="text-lg font-semibold">
        Pricing summary
      </h2>
      <p className="mt-1 text-sm">
        Please confirm pricing before completing payment. Funding source: {fundingSourceLabel}
      </p>
      <table className="mt-4 w-full text-sm" aria-label="Price breakdown">
        <caption className="sr-only">Service line items and total payable</caption>
        <tbody>
          {lineItems.map((li, i) => (
            <tr key={i}>
              <th scope="row" className="py-1 text-left font-normal">
                {li.description}
              </th>
              <td className="py-1 text-right">{fmt(li.totalCents)}</td>
            </tr>
          ))}
          {platformFeeCents > 0 ? (
            <tr>
              <th scope="row" className="py-1 text-left font-normal">
                MapAble service fee
              </th>
              <td className="py-1 text-right">{fmt(platformFeeCents)}</td>
            </tr>
          ) : null}
          <tr className="border-t font-semibold">
            <th scope="row" className="py-2 text-left">
              Total payable
            </th>
            <td className="py-2 text-right">{fmt(totalCents)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-4 text-xs text-muted-foreground">
        This tool helps organise payment, invoice, and payout information. It does not decide NDIS
        funding eligibility or guarantee claim approval.
      </p>
    </section>
  );
}
