import { format } from "date-fns";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { incidentListWhereForUser } from "@/lib/safety/incident-access";
import {
  incidentCategoryLabel,
  incidentSeverityLabel,
} from "@/lib/safety/incident-status-labels";

export const metadata = { title: "Incident reports | Safety centre" };

export default async function SafetyIncidentsPage() {
  const user = await requireAuth();
  const incidents = await prisma.incidentReport.findMany({
    where: incidentListWhereForUser(user.id, false),
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Incident reports</h1>
          <p className="text-muted-foreground">
            You can save a draft and return later. Only authorised people can see
            full details.
          </p>
        </div>
        <Link
          href="/dashboard/safety/incidents/new"
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-6 py-3 text-primary-foreground"
        >
          Report a concern
        </Link>
      </header>

      {incidents.length === 0 ? (
        <p className="text-muted-foreground">No reports yet.</p>
      ) : (
        <ul className="space-y-3">
          {incidents.map((i) => (
            <li key={i.id}>
              <Link
                href={`/dashboard/safety/incidents/${i.id}`}
                className="block rounded-lg border border-border bg-card p-4 transition hover:border-primary/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{i.title}</span>
                  <StatusBadge status={i.status} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {incidentCategoryLabel(i.category)} ·{" "}
                  {incidentSeverityLabel(i.severity)} ·{" "}
                  {format(i.createdAt, "d MMM yyyy")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
