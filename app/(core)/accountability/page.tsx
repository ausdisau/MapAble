import { isFederatedAccountabilityV2Enabled } from "@/lib/config/y5-rights-infrastructure";
import { listPublicFederatedPartners } from "@/lib/federated-accountability/federation-partner-service";
import {
  getAccountabilityDisclaimer,
  listPublicAccountabilityReports,
} from "@/lib/national-accountability/accountability-service";

export default async function AccountabilityPortalPage() {
  const [reports, partners] = await Promise.all([
    listPublicAccountabilityReports(),
    isFederatedAccountabilityV2Enabled()
      ? listPublicFederatedPartners()
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">National accountability portal</h1>
      <p className="text-muted-foreground">
        Published aggregate accountability reports — no participant-identifiable data.
      </p>
      <p className="text-xs text-muted-foreground">{getAccountabilityDisclaimer()}</p>
      {partners.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-medium">Federated partners</h2>
          <ul className="space-y-2">
            {partners.map((p) => (
              <li key={p.id} className="rounded border p-3 text-sm">
                {p.partnerName}
                {p.jurisdictionLabel || p.jurisdiction
                  ? ` — ${p.jurisdictionLabel ?? p.jurisdiction}`
                  : ""}
                <p className="text-xs text-muted-foreground">{p.scope}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <ul className="space-y-4">
        {reports.map((r) => (
          <li key={r.id} className="rounded-lg border p-4">
            <h2 className="font-semibold">{r.title}</h2>
            <p className="text-sm">{r.summary}</p>
            <p className="text-xs text-muted-foreground">
              {r.category} — {r.periodLabel}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
