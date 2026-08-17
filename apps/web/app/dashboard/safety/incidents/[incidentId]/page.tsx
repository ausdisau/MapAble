import Link from "next/link";

import { SafetyIncidentDetailClient } from "@/components/safety/SafetyIncidentDetailClient";
import { requireAuth } from "@/lib/auth/guards";
import { getIncidentForUser } from "@/lib/safety/incident-access";

export default async function SafetyIncidentDetailPage({
  params,
}: {
  params: Promise<{ incidentId: string }>;
}) {
  const user = await requireAuth();
  const { incidentId } = await params;
  const incident = await getIncidentForUser(
    incidentId,
    user.id,
    user.primaryRole
  );

  if (!incident) {
    return (
      <div className="space-y-4">
        <p role="alert">Incident report not found.</p>
        <Link
          href="/dashboard/safety/incidents"
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to incident reports
        </Link>
      </div>
    );
  }

  const detail = {
    id: incident.id,
    title: incident.title,
    description: incident.description,
    status: incident.status,
    severity: incident.severity,
    category: incident.category,
    immediateRiskPresent: incident.immediateRiskPresent,
    possibleReportableIncident: incident.possibleReportableIncident,
    safeguardingConcern: incident.safeguardingConcern,
    resolutionSummary: incident.resolutionSummary,
    createdAt: incident.createdAt.toISOString(),
    updatedAt: incident.updatedAt.toISOString(),
    closedAt: incident.closedAt?.toISOString() ?? null,
    reportedByName: incident.reportedBy?.name ?? null,
    updates: incident.updates.map((u) => ({
      id: u.id,
      body: u.body,
      createdAt: u.createdAt.toISOString(),
    })),
  };

  return <SafetyIncidentDetailClient incident={detail} />;
}
