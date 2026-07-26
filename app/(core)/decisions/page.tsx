import Link from "next/link";

import {
  listDecisionTypes,
  listPublicDecisions,
} from "@/lib/governance/public-decision-register/decision-service";

export default async function PublicDecisionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const [decisions, types] = await Promise.all([
    listPublicDecisions(type),
    listDecisionTypes(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Public decision register</h1>
      <p className="text-muted-foreground">
        Recorded governance and policy decisions — not legal advice.
      </p>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/decisions"
          className={!type ? "font-semibold text-primary" : "text-muted-foreground underline"}
        >
          All
        </Link>
        {types.map((t) => (
          <Link
            key={t}
            href={`/decisions?type=${encodeURIComponent(t)}`}
            className={
              type === t ? "font-semibold text-primary" : "text-muted-foreground underline"
            }
          >
            {t}
          </Link>
        ))}
      </div>
      <ul className="space-y-4">
        {decisions.map((d) => (
          <li key={d.id} className="rounded-lg border p-4">
            <h2 className="font-semibold">{d.title}</h2>
            <p className="text-sm">{d.summary}</p>
            {d.rationale ? (
              <p className="mt-2 text-sm text-muted-foreground">{d.rationale}</p>
            ) : null}
            {d.impactedSystems.length > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Impacted: {d.impactedSystems.join(", ")}
              </p>
            ) : null}
            {d.disputeContact ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Disputes: {d.disputeContact}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-muted-foreground">
              {d.decisionType}
              {d.charterVersion ? ` — charter v${d.charterVersion}` : ""}
              {d.publishedAt
                ? ` — ${d.publishedAt.toLocaleDateString("en-AU")}`
                : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
