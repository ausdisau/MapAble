import Link from "next/link";

export function AdminMetricCard({
  title,
  value,
  href,
  description,
}: {
  title: string;
  value: number | string;
  href?: string;
  description?: string;
}) {
  const content = (
    <>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
      {description ? (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      ) : null}
    </>
  );

  const className =
    "block rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
