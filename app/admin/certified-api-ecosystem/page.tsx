import { EcosystemAdminForm } from "@/app/admin/certified-api-ecosystem/EcosystemAdminForm";
import { requireAdmin } from "@/lib/auth/guards";
import {
  getPartnerConcentrationMetrics,
  listCertifiedApiEcosystem,
} from "@/lib/certified-api-ecosystem/ecosystem-service";
import {
  API_CERTIFICATION_DISCLAIMER,
  isCertifiedApiEcosystemV2Enabled,
} from "@/lib/config/y5-rights-infrastructure";

export default async function CertifiedApiEcosystemPage() {
  await requireAdmin();
  const data = await listCertifiedApiEcosystem();
  const concentration = data.disabled ? null : await getPartnerConcentrationMetrics();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Certified API ecosystem</h1>
      <p className="text-sm text-muted-foreground">{API_CERTIFICATION_DISCLAIMER}</p>
      {!isCertifiedApiEcosystemV2Enabled() ? (
        <p className="text-amber-800">CERTIFIED_API_ECOSYSTEM_V2_ENABLED is false.</p>
      ) : null}
      {concentration?.warning ? (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Partner concentration warning: top organisation holds{" "}
          {Math.round(concentration.topOrganisationShare * 100)}% of listings.
        </p>
      ) : null}
      <EcosystemAdminForm />
      {data.disabled ? (
        <p>No entries — ecosystem disabled.</p>
      ) : (
        <ul className="space-y-2">
          {data.entries.map((e) => (
            <li key={e.id} className="rounded border p-3 text-sm">
              {e.appName} — {e.certificationTier} ({e.status})
              <p className="text-xs text-muted-foreground">ID: {e.id}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
