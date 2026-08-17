import Link from "next/link";

import { BehavioralRiskPanelScaffold } from "@/components/safety/BehavioralRiskPanelScaffold";
import { requireAdmin } from "@/lib/auth/guards";
import { isBehavioralRiskEnabled } from "@/lib/config/strategic-2026";
import { prisma } from "@/lib/prisma";

export default async function AdminIncidentsPage() {
  await requireAdmin();
  const incidents = await prisma.incidentReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Incident triage</h1>
      {isBehavioralRiskEnabled() ? <BehavioralRiskPanelScaffold /> : null}
      <ul className="space-y-3">
        {incidents.map((i) => (
          <li key={i.id}>
            <Link href={`/admin/incidents/${i.id}`} className="block rounded-xl border p-4">
              <span className="font-medium">{i.title}</span>
              <span className="ml-2 text-sm">
                {i.severity} — {i.status}
                {i.possibleReportableIncident ? " — possible reportable incident" : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
