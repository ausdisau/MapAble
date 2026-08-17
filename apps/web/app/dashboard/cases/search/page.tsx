import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { searchCasesForUser } from "@/lib/cases/case-service";
import { caseManagementConfig } from "@/lib/config/case-management";

export const metadata = { title: "AI search | Cases" };
export const dynamic = "force-dynamic";

export default async function CaseSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!caseManagementConfig.enabled || !caseManagementConfig.aiEnabled) {
    return (
      <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">
        Case AI search is disabled in this environment.
      </div>
    );
  }
  const user = await requirePermission("case:ai:run");
  const { q } = await searchParams;
  const trimmed = (q ?? "").trim();

  const hits =
    trimmed.length >= 2
      ? await searchCasesForUser(user.id, user.primaryRole, trimmed)
      : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">AI case search</h1>
        <p className="text-muted-foreground">
          Natural-language search across cases you are authorised to see.
          Results are ranked by a deterministic term-frequency scorer.
        </p>
      </header>

      <form action="/dashboard/cases/search" method="get" className="space-y-2">
        <label
          className="block text-sm font-medium"
          htmlFor="case-search-input"
        >
          Search
        </label>
        <input
          id="case-search-input"
          name="q"
          type="search"
          defaultValue={trimmed}
          minLength={2}
          maxLength={500}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="e.g. high-risk housing cases"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Search
        </button>
      </form>

      {trimmed.length >= 2 ? (
        hits.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No matches for &ldquo;{trimmed}&rdquo;.
          </p>
        ) : (
          <ul className="space-y-2">
            {hits.map((hit) => (
              <li key={hit.caseId}>
                <Link
                  href={`/dashboard/cases/${hit.caseId}`}
                  className="block rounded-md border border-border bg-card p-3 hover:border-primary/40"
                >
                  <p className="font-medium">
                    {hit.title}{" "}
                    <span className="font-mono text-xs text-muted-foreground">
                      {hit.reference}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    score {hit.score} · matched: {hit.matchedTerms.join(", ")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
