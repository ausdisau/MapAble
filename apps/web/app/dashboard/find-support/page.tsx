import { ProviderSearchResultCard } from "@/components/phase4/ProviderSearchResultCard";
import { requireAuth } from "@/lib/auth/guards";
import { searchCareProviders } from "@/lib/search/provider-search-service";

export default async function FindSupportPage() {
  await requireAuth();
  const results = await searchCareProviders({});

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Find support providers</h1>
      <p className="text-muted-foreground">
        Controlled search — list view. Private worker credentials are not shown.
      </p>
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
