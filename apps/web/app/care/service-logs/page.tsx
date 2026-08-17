import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { listServiceLogsForUser } from "@/lib/care/care-service-log-service";

export default async function CareServiceLogsPage() {
  const user = await requirePermission("care:read:self");
  const logs = await listServiceLogsForUser(user);

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Service logs</h1>
      <ul className="space-y-3">
        {logs.map((log) => (
          <li key={log.id} className="rounded-xl border p-4">
            <p className="font-medium">Log {log.id.slice(0, 8)}</p>
            <p className="text-sm text-muted-foreground">Status: {log.status}</p>
            {log.careBookingId ? (
              <Link
                href={`/care/bookings/${log.careBookingId}`}
                className="mt-2 inline-block text-sm underline"
              >
                View booking
              </Link>
            ) : null}
          </li>
        ))}
        {logs.length === 0 ? (
          <li className="text-sm text-muted-foreground">No service logs yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
