import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { listServiceLogsForUser } from "@/lib/care/care-service-log-service";

export default async function ProviderCareServiceLogsPage() {
  const user = await requirePermission("care:read:org");
  const logs = await listServiceLogsForUser(user);

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Service logs</h1>
      <ul className="space-y-3">
        {logs.map((log) => (
          <li key={log.id} className="rounded-xl border p-4 text-sm">
            <p>
              Status: <strong>{log.status}</strong>
            </p>
            {log.careBookingId ? (
              <Link
                href={`/provider/care/bookings/${log.careBookingId}`}
                className="underline"
              >
                View booking
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
