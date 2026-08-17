import { ProviderSearchResultCard } from "@/components/phase4/ProviderSearchResultCard";
import { requireAuth } from "@/lib/auth/guards";
import { searchTransportOperators } from "@/lib/search/provider-search-service";

export default async function FindTransportPage() {
  await requireAuth();
  const results = await searchTransportOperators({});

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Find transport</h1>
        <p className="text-muted-foreground">
          List view — keyboard accessible. Verification status shown in plain
          language.
        </p>
      </header>
      <ul className="space-y-4">
        {results.map((r) => (
          <li key={r.id}>
            <ProviderSearchResultCard
              provider={{
                name: r.name,
                verificationStatus: r.verificationStatus,
                verificationCaution: r.verificationCaution,
                serviceRegions: [],
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
