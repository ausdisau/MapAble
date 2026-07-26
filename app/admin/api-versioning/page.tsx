import { getApiVersionPolicy } from "@/lib/api/versioning/version-policy-service";
import { requireAdmin } from "@/lib/auth/guards";
import { y3NationalTrustConfig } from "@/lib/config/y3-national-trust";

export default async function ApiVersioningPage() {
  await requireAdmin();
  const policy = await getApiVersionPolicy();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Public API versioning</h1>
      <p className="text-sm">Default: {policy.defaultVersion}</p>
      <p className="text-sm text-muted-foreground">{policy.deprecationNotice}</p>
      {y3NationalTrustConfig.publicApiV2PartnerEnabled ? (
        <p className="text-sm text-green-800">
          Y3 partner v2 routes enabled (care/shifts, plan-manager exports).
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          PUBLIC_API_V2_PARTNER_ENABLED is off — v2 remains draft-only.
        </p>
      )}
      <ul className="space-y-2">
        {policy.versions.map((v) => (
          <li key={v.id} className="rounded border p-3">
            {v.version} — {v.status}
            {v.changelog ? <p className="text-xs">{v.changelog}</p> : null}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Promote v2 to stable via admin API or database when partners are notified.
      </p>
    </div>
  );
}
