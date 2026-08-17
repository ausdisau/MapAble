import type { CopilotProviderResult } from "@/lib/copilot/types";

type Props = {
  results: CopilotProviderResult[];
};

export function AskProviderResultSnippets({ results }: Props) {
  if (results.length === 0) return null;

  return (
    <section aria-labelledby="ask-provider-results-heading">
      <h3
        id="ask-provider-results-heading"
        className="mb-2 text-sm font-semibold"
      >
        Directory matches ({results.length})
      </h3>
      <ul className="space-y-2">
        {results.map((p) => (
          <li
            key={p.id}
            className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm"
          >
            <p className="font-medium text-foreground">{p.name}</p>
            <p className="text-xs text-muted-foreground">
              {p.locationLabel || "Location not listed"}
              {p.registered ? " · NDIS registration groups on file" : ""}
            </p>
            {p.services.length > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {p.services.join(" · ")}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        From the public NDIS provider export — not MapAble-verified registration.
      </p>
    </section>
  );
}
