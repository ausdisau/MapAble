export function PayoutSummaryCard({
  title,
  amountCents,
  currency = "AUD",
  description,
}: {
  title: string;
  amountCents: number;
  currency?: string;
  description?: string;
}) {
  const formatted = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
  }).format(amountCents / 100);

  return (
    <article className="rounded-lg border p-4" aria-labelledby={`summary-${title}`}>
      <h3 id={`summary-${title}`} className="text-base font-semibold">
        {title}
      </h3>
      <p className="mt-2 text-2xl font-bold" aria-label={`Amount ${formatted}`}>
        {formatted}
      </p>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
    </article>
  );
}
