import { requireAdmin } from "@/lib/auth/guards";
import {
  getBackupRecoveryPilotMetrics,
  listBackupRecoveriesForAdmin,
} from "@/lib/care/backup-recovery-pilot";

export default async function BackupRecoveryAdminPage() {
  await requireAdmin();
  const [metrics, recoveries] = await Promise.all([
    getBackupRecoveryPilotMetrics(),
    listBackupRecoveriesForAdmin(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Backup shift recovery pilot</h1>
      <p className="text-muted-foreground">
        Operational queue for backup recoveries. Human dispatch assigns workers — no
        autonomous assignment.
      </p>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Open recoveries</p>
          <p className="text-2xl font-semibold">{metrics.openCount}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">30d assignment rate</p>
          <p className="text-2xl font-semibold">
            {Math.round(metrics.assignmentRate * 100)}%
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Participant approval rate</p>
          <p className="text-2xl font-semibold">
            {Math.round(metrics.participantApprovalRate * 100)}%
          </p>
        </div>
        <div
          className={`rounded-lg border p-4 ${metrics.killCriteriaBreached ? "border-destructive" : ""}`}
        >
          <p className="text-sm text-muted-foreground">Serious misfits (30d)</p>
          <p className="text-2xl font-semibold">{metrics.seriousMisfitCount}</p>
          {metrics.killCriteriaBreached && (
            <p className="mt-1 text-sm text-destructive">
              Kill criteria: 2+ serious misfits
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border">
        <h2 className="border-b p-4 font-medium">Recovery queue</h2>
        <ul className="divide-y">
          {recoveries.length === 0 ? (
            <li className="p-4 text-sm text-muted-foreground">No open recoveries.</li>
          ) : (
            recoveries.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 p-4 text-sm">
                <span className="font-medium">{r.status}</span>
                <span className="text-muted-foreground">
                  Shift {r.careShiftId.slice(0, 8)}
                </span>
                {r.autoDetected && (
                  <span className="rounded bg-muted px-2 py-0.5 text-xs">auto</span>
                )}
                {r.misfitSeverity !== "none" && (
                  <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                    misfit: {r.misfitSeverity}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
