import { requireAdmin } from "@/lib/auth/guards";
import { listOpenBackupRecoveries } from "@/lib/care/backup-shift-recovery-service";
import { syncOperationalQueues } from "@/lib/transport/dispatch-console/dispatch-service";
import { awaitParticipantConfirmationState } from "@/lib/matching/matching-service";
import { prisma } from "@/lib/prisma";

export default async function DispatchConsolePage() {
  const user = await requireAdmin();
  const queues = await syncOperationalQueues(user.id);
  const list = Array.isArray(queues) ? queues : [];
  const recoveries = await listOpenBackupRecoveries();

  const pendingMatchRuns = await prisma.matchRun.findMany({
    where: { status: "completed", careRequestId: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const awaitingConfirm = [];
  for (const run of pendingMatchRuns) {
    const state = await awaitParticipantConfirmationState(run.id);
    if (state.state === "awaiting_participant_confirmation") {
      awaitingConfirm.push(run);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Dispatch console</h1>
        <p className="text-muted-foreground">
          Operational queues for care, transport and critical incidents. Human
          dispatch required — not autonomous assignment.
        </p>
      </div>

      {awaitingConfirm.length > 0 ? (
        <section>
          <h2 className="font-semibold">Awaiting participant confirmation</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {awaitingConfirm.map((run) => (
              <li key={run.id} className="rounded-lg border p-3">
                Match run {run.id.slice(0, 8)} — care request{" "}
                {run.careRequestId?.slice(0, 8)} waiting for participant review
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {recoveries.length > 0 ? (
        <section>
          <h2 className="font-semibold">Backup shift recovery queue</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {recoveries.map((r) => (
              <li key={r.id} className="rounded-lg border p-3">
                Shift {r.careShiftId.slice(0, 8)} — {r.status.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <table className="w-full text-sm">
        <caption className="sr-only">Open dispatch queue items</caption>
        <thead>
          <tr>
            <th scope="col">Priority</th>
            <th scope="col">Type</th>
            <th scope="col">Summary</th>
          </tr>
        </thead>
        <tbody>
          {list.map((q) => (
            <tr key={q.id} className="border-t">
              <td>{q.priority}</td>
              <td>{q.queueType.replace(/_/g, " ")}</td>
              <td>{q.plainLanguageSummary ?? q.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
