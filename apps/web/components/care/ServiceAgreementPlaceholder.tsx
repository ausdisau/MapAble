export function ServiceAgreementPlaceholder({
  title,
  summary,
}: {
  title?: string;
  summary?: string | null;
}) {
  return (
    <section className="rounded-xl border border-dashed p-4" aria-labelledby="sa-heading">
      <h2 id="sa-heading" className="font-semibold">
        {title ?? "Service agreement (placeholder)"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {summary ??
          "Your provider will share a service agreement for review and signing. This placeholder does not replace a signed agreement."}
      </p>
    </section>
  );
}
