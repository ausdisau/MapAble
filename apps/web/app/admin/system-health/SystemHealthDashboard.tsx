import { nationalPlatformConfig } from "@/lib/config/national-platform";
import { estimateMonthlyTotal } from "@/lib/platform/cost";
import { listFederationTrusts } from "@/lib/platform/federation";
import { getRecentHealthChecks, runNationalHealthChecks } from "@/lib/platform/observability";
import { listRestoreDrills, RESILIENCE_CAPABILITIES } from "@/lib/platform/resilience";
import { INCIDENT_PLAYBOOKS } from "@/lib/platform/security-operations";

export async function SystemHealthDashboard() {
  const [health, recentChecks, drills, federation] = await Promise.all([
    runNationalHealthChecks(),
    getRecentHealthChecks(20),
    listRestoreDrills(5),
    listFederationTrusts(10),
  ]);

  const monthlyEstimate = estimateMonthlyTotal();
  const untested = RESILIENCE_CAPABILITIES.filter((c) => c.status === "untested");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">System health</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          National platform observability. Sensitive values are redacted. Failover
          claims require tested restore drill evidence.
        </p>
      </header>

      <section
        aria-labelledby="overall-status-heading"
        className="rounded-lg border p-4"
      >
        <h2 id="overall-status-heading" className="font-heading text-lg font-semibold">
          Overall status
        </h2>
        <p className="mt-2 text-sm">
          <span className="font-medium">Status:</span> {health.overall}
          {" · "}
          <span className="font-medium">Region:</span> {health.region}
          {" · "}
          <span className="font-medium">Checked:</span>{" "}
          {new Date(health.checkedAt).toLocaleString("en-AU")}
        </p>
        {!nationalPlatformConfig.nationalPlatformEnabled && (
          <p className="mt-2 text-sm text-amber-700">
            MAPABLE_NATIONAL_PLATFORM_ENABLED is false — health checks run but
            are not persisted.
          </p>
        )}
      </section>

      <section aria-labelledby="component-checks-heading" className="space-y-3">
        <h2 id="component-checks-heading" className="font-heading text-lg font-semibold">
          Component checks
        </h2>
        <ul className="divide-y rounded-md border">
          {health.checks.map((check) => (
            <li key={check.component} className="px-4 py-3 text-sm">
              <span className="font-medium">{check.component}</span>
              <span className="ml-2 text-muted-foreground">({check.status})</span>
              <p className="text-muted-foreground">{check.message}</p>
              {check.latencyMs != null && (
                <p className="text-xs text-muted-foreground">{check.latencyMs}ms</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="resilience-heading" className="space-y-3">
        <h2 id="resilience-heading" className="font-heading text-lg font-semibold">
          Resilience capabilities
        </h2>
        {untested.length > 0 && (
          <p className="text-sm text-amber-700">
            {untested.length} capability/untested — do not claim these work without
            drill evidence.
          </p>
        )}
        <ul className="divide-y rounded-md border">
          {RESILIENCE_CAPABILITIES.map((cap) => (
            <li key={cap.id} className="px-4 py-3 text-sm">
              <span className="font-medium">{cap.name}</span>
              <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs">
                {cap.status}
              </span>
              <p className="text-muted-foreground">{cap.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="restore-drills-heading" className="space-y-3">
        <h2 id="restore-drills-heading" className="font-heading text-lg font-semibold">
          Recent restore drills
        </h2>
        {drills.disabled ? (
          <p className="text-sm text-muted-foreground">National platform disabled.</p>
        ) : drills.records.length === 0 ? (
          <p className="text-sm text-muted-foreground">No restore drills recorded.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {drills.records.map((drill) => (
              <li key={drill.id} className="px-4 py-3 text-sm">
                {drill.title} — {drill.outcome}
                {drill.testedAt && (
                  <span className="ml-2 text-muted-foreground">
                    {new Date(drill.testedAt).toLocaleDateString("en-AU")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="federation-heading" className="space-y-3">
        <h2 id="federation-heading" className="font-heading text-lg font-semibold">
          Federation trusts
        </h2>
        <p className="text-sm text-muted-foreground">
          Federated identity does not auto-grant participant authority (
          {String(nationalPlatformConfig.federatedIdentityGrantsParticipantAuthority)}).
        </p>
        {federation.disabled ? (
          <p className="text-sm text-muted-foreground">Federation disabled.</p>
        ) : federation.trusts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No federation trusts configured.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {federation.trusts.map((trust) => (
              <li key={trust.id} className="px-4 py-3 text-sm">
                {trust.partnerName} ({trust.protocol}) — {trust.status}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="cost-heading" className="space-y-3">
        <h2 id="cost-heading" className="font-heading text-lg font-semibold">
          Cost baseline (documented estimate)
        </h2>
        <p className="text-sm">
          Estimated monthly infrastructure: ~${monthlyEstimate.toLocaleString("en-AU")} AUD
          (documented baseline, not live billing).
        </p>
      </section>

      <section aria-labelledby="security-ops-heading" className="space-y-3">
        <h2 id="security-ops-heading" className="font-heading text-lg font-semibold">
          Incident playbooks
        </h2>
        <ul className="divide-y rounded-md border">
          {INCIDENT_PLAYBOOKS.map((playbook) => (
            <li key={playbook.id} className="px-4 py-3 text-sm">
              <span className="font-medium">{playbook.title}</span>
              <p className="text-muted-foreground">{playbook.steps[0]}</p>
            </li>
          ))}
        </ul>
      </section>

      {recentChecks.disabled ? null : recentChecks.checks.length > 0 && (
        <section aria-labelledby="history-heading" className="space-y-3">
          <h2 id="history-heading" className="font-heading text-lg font-semibold">
            Health check history
          </h2>
          <ul className="divide-y rounded-md border">
            {recentChecks.checks.slice(0, 10).map((check) => (
              <li key={check.id} className="px-4 py-3 text-sm">
                {check.component} — {check.status}
                <span className="ml-2 text-muted-foreground">
                  {new Date(check.checkedAt).toLocaleString("en-AU")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
