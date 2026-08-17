import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminIncidentActions } from "@/components/admin/AdminIncidentActions";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminIncidentDetailPage({
  params,
}: {
  params: Promise<{ incidentId: string }>;
}) {
  await requireAdmin();
  const { incidentId } = await params;

  const incident = await prisma.incidentReport.findUnique({
    where: { id: incidentId },
    include: {
      updates: { orderBy: { createdAt: "desc" }, take: 10 },
      reportedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!incident) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/incidents" className="text-sm text-primary hover:underline">
        ← All incidents
      </Link>
      <header>
        <h1 className="font-heading text-2xl font-bold">{incident.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {incident.severity} · {incident.status}
          {incident.intakePath ? ` · intake: ${incident.intakePath}` : ""}
        </p>
      </header>

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold">Description</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm">{incident.description}</p>
      </section>

      <dl className="grid max-w-2xl gap-3 rounded-xl border p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium">Reported by</dt>
          <dd>{incident.reportedBy.name ?? incident.reportedBy.email}</dd>
        </div>
        <div>
          <dt className="font-medium">Participant intent</dt>
          <dd>{incident.participantIntent ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium">Safeguarding</dt>
          <dd>{incident.safeguardingConcern ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="font-medium">Immediate risk</dt>
          <dd>{incident.immediateRiskPresent ? "Yes" : "No"}</dd>
        </div>
      </dl>

      <AdminIncidentActions incidentId={incident.id} status={incident.status} />

      {incident.updates.length > 0 ? (
        <section>
          <h2 className="font-semibold">Updates</h2>
          <ul className="mt-2 space-y-2">
            {incident.updates.map((u) => (
              <li key={u.id} className="rounded-lg border p-3 text-sm">
                {u.body}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
