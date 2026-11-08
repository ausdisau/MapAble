import { requireAdmin } from "@/lib/auth/guards";
import { phase5Config } from "@/lib/config/phase5";
import { getNdiaGatewayReadiness } from "@/lib/ndis/api-gateway/ndia-gateway-contract";

export default async function NdiaReadinessPage() {
  await requireAdmin();
  const readiness = getNdiaGatewayReadiness();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">NDIA API readiness</h1>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:bg-amber-950 dark:text-amber-100">
        <strong>Not an authorised NDIA connection.</strong> Evidence bundles and
        synthetic dry-runs support planning only. A local feature flag,
        credentials, or passing mock test does not prove NDIA access.
      </p>
      <dl className="grid gap-3 rounded-lg border p-4 text-sm">
        <div>
          <dt className="font-semibold">NDIA adapter mode</dt>
          <dd>{readiness.mode.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt className="font-semibold">Government access evidence</dt>
          <dd>Not independently verified</dd>
        </div>
        <div>
          <dt className="font-semibold">Live government transmission</dt>
          <dd>Not implemented in this adapter</dd>
        </div>
        <div>
          <dt className="font-semibold">Existing readiness module</dt>
          <dd>{phase5Config.ndiaReadinessEnabled ? "Locally enabled" : "Disabled"}</dd>
        </div>
        <div>
          <dt className="font-semibold">Legacy real-submission flag</dt>
          <dd>
            {readiness.legacySubmissionFlagObserved
              ? "Set — review urgently; this is not NDIA authorisation"
              : "Not set"}
          </dd>
        </div>
      </dl>
      <h2 className="text-xl font-semibold">Blocking evidence required</h2>
      <ul className="list-disc space-y-2 pl-6 text-sm">
        {readiness.blockers.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <p className="text-sm">
        The NDIA Digital Partnership Office must approve access and provide
        current API specifications. Keep the NDIS Commission's registration
        and worker-screening systems separate from NDIA claiming.
      </p>
    </div>
  );
}
