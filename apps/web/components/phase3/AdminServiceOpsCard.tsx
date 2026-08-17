import Link from "next/link";

export function AdminServiceOpsCard({
  title,
  count,
  href,
  description,
}: {
  title: string;
  count: number;
  href: string;
  description: string;
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-3xl font-bold tabular-nums" aria-live="polite">
        {count}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
      >
        Review items
      </Link>
    </article>
  );
}
