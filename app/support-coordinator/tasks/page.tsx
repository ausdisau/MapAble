import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { listCoordinatorTasks } from "@/lib/support/coordinator/relationship-service";

export default async function CoordinatorTasksPage() {
  const user = await requirePermission("coordinator:portal");
  const tasks = await listCoordinatorTasks(user.id);

  return (
    <div className="space-y-6 p-4">
      <Link className="text-primary underline text-sm" href="/support-coordinator">
        Back
      </Link>
      <h1 className="font-heading text-2xl font-bold">Tasks</h1>

      <section>
        <h2 className="font-medium">Open incidents</h2>
        <ul className="mt-2 text-sm">
          {tasks.incidents.length === 0 ? (
            <li className="text-muted-foreground">None</li>
          ) : (
            tasks.incidents.map((i) => (
              <li key={i.id}>
                {i.title ?? i.id.slice(0, 8)} — {i.status}
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="font-medium">Backup recoveries (read-only)</h2>
        <ul className="mt-2 text-sm">
          {tasks.recoveries.length === 0 ? (
            <li className="text-muted-foreground">None</li>
          ) : (
            tasks.recoveries.map((r) => (
              <li key={r.id}>
                Shift {r.careShiftId.slice(0, 8)} — {r.status}
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="font-medium">Reschedule requests</h2>
        <ul className="mt-2 text-sm">
          {tasks.rescheduleRequests.length === 0 ? (
            <li className="text-muted-foreground">None</li>
          ) : (
            tasks.rescheduleRequests.map((r) => (
              <li key={r.id}>
                Request {r.id.slice(0, 8)} — {r.notes ?? "pending"}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
