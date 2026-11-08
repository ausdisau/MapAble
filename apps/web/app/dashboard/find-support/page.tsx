import Link from "next/link";

import { ProviderSearchResultCard } from "@/components/phase4/ProviderSearchResultCard";
import { requireAuth } from "@/lib/auth/guards";
import { isParticipantMatchingPreviewEnabled } from "@/lib/matching/participant-preview-config";
import { searchCareProviders } from "@/lib/search/provider-search-service";

export default async function FindSupportPage() {
  const user = await requireAuth();
  const results = await searchCareProviders({});

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Find support providers</h1>
      <p className="text-muted-foreground">
        Controlled search — list view. Private worker credentials are not shown.
      </p>
      {isParticipantMatchingPreviewEnabled() &&
      (user.roles.includes("participant") || user.primaryRole === "mapable_admin") ? (
        <p className="rounded-lg border border-amber-400 bg-amber-50 p-4">
          <Link
            href="/dashboard/matching-preview"
            className="inline-flex min-h-11 items-center font-semibold text-[#005B7F] underline underline-offset-4"
          >
            Explore fictional worker matching (demonstration only)
          </Link>
          <span className="block text-sm text-slate-700">
            This is separate from provider search and uses no real workers or screening records.
          </span>
        </p>
      ) : null}
      <ul className="space-y-3" aria-label="Search results">
        {results.map((r) => (
          <li key={r.id}>
            <ProviderSearchResultCard provider={r} />
          </li>
        ))}
      </ul>
    </div>
  );
}
