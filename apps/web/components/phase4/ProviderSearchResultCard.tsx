export function ProviderSearchResultCard({
  provider,
}: {
  provider: {
    name: string;
    verificationStatus: string;
    verificationCaution: string | null;
    serviceRegions: string[];
  };
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-medium">{provider.name}</h2>
      <p className="text-sm">
        Verification: {provider.verificationStatus.replace(/_/g, " ")}
      </p>
      {provider.verificationCaution ? (
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-200" role="note">
          {provider.verificationCaution}
        </p>
      ) : null}
      <p className="mt-1 text-sm text-muted-foreground">
        Regions: {provider.serviceRegions.join(", ") || "Not listed"}
      </p>
    </article>
  );
}
