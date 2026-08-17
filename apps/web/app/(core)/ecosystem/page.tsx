import { listPublicEcosystemDirectory } from "@/lib/api/certified-ecosystem/ecosystem-service";
import { API_CERTIFICATION_DISCLAIMER } from "@/lib/config/y5-rights-infrastructure";

export default async function EcosystemPage() {
  const entries = await listPublicEcosystemDirectory();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Certified API ecosystem</h1>
      <p className="text-sm text-muted-foreground">{API_CERTIFICATION_DISCLAIMER}</p>
      <ul className="space-y-4">
        {entries.map((e) => (
          <li key={e.id} className="rounded-lg border p-4">
            <h2 className="font-semibold">{e.appName}</h2>
            <p className="text-sm">Tier: {e.certificationTier}</p>
            {e.expiresAt ? (
              <p className="text-xs text-muted-foreground">
                Expires: {e.expiresAt.toLocaleDateString()}
              </p>
            ) : null}
          </li>
        ))}
        {entries.length === 0 ? (
          <li className="text-sm text-muted-foreground">No ecosystem listings published.</li>
        ) : null}
      </ul>
    </div>
  );
}
