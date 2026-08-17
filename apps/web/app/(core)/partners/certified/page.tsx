import { listPublicCertifiedPartners } from "@/lib/api/certification/certification-service";
import { API_CERTIFICATION_DISCLAIMER } from "@/lib/config/y5-rights-infrastructure";

export default async function CertifiedPartnersPage() {
  const partners = await listPublicCertifiedPartners();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Certified API partners</h1>
      <p className="text-sm text-muted-foreground">{API_CERTIFICATION_DISCLAIMER}</p>
      <ul className="space-y-4">
        {partners.map((p) => (
          <li key={p.id} className="rounded-lg border p-4">
            <h2 className="font-semibold">{p.appName}</h2>
            <p className="text-sm text-muted-foreground">
              Tier: {p.certificationTier ?? "standard"}
            </p>
          </li>
        ))}
        {partners.length === 0 ? (
          <li className="text-sm text-muted-foreground">No certified partners published.</li>
        ) : null}
      </ul>
    </div>
  );
}
