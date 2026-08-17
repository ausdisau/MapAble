type Props = {
  summary: string;
  answer: string;
  intentLabel?: string;
};

export function PlainLanguageSummary({ summary, answer, intentLabel }: Props) {
  return (
    <section aria-labelledby="copilot-summary-heading" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="copilot-summary-heading" className="text-lg font-semibold">
          MapAble Co-Pilot
        </h2>
        {intentLabel ? (
          <span className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
            {intentLabel}
          </span>
        ) : null}
      </div>
      <p className="text-base font-medium text-foreground">{summary}</p>
      <p className="text-base leading-relaxed text-muted-foreground">{answer}</p>
      <p
        className="rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-3 text-sm font-medium text-foreground"
        role="status"
      >
        Nothing is booked, shared, or claimed until you confirm.
      </p>
    </section>
  );
}
