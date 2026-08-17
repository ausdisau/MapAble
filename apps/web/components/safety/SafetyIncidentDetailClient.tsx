"use client";

import { format } from "date-fns";
import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  incidentCategoryLabel,
  incidentSeverityLabel,
} from "@/lib/safety/incident-status-labels";

export type SafetyIncidentDetail = {
  id: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  category: string;
  immediateRiskPresent: boolean;
  possibleReportableIncident: boolean;
  safeguardingConcern: boolean;
  resolutionSummary: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  reportedByName: string | null;
  updates: { id: string; body: string; createdAt: string }[];
};

export function SafetyIncidentDetailClient({
  incident,
}: {
  incident: SafetyIncidentDetail;
}) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link
          href="/dashboard/safety/incidents"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Incident reports
        </Link>
        <h1 className="font-heading text-2xl font-bold">{incident.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={incident.status} />
          <span className="text-sm text-muted-foreground">
            {incidentCategoryLabel(incident.category)} ·{" "}
            {incidentSeverityLabel(incident.severity)}
          </span>
        </div>
      </header>

      {(incident.immediateRiskPresent ||
        incident.safeguardingConcern ||
        incident.possibleReportableIncident) && (
        <div
          role="alert"
          className="rounded-xl border-2 border-destructive bg-destructive/10 p-4 text-sm"
        >
          {incident.immediateRiskPresent ? (
            <p className="font-semibold text-destructive">
              Flagged as immediate safety risk — if you are in danger, call 000.
            </p>
          ) : null}
          {incident.safeguardingConcern ? (
            <p className="mt-1">Safeguarding concern — reviewed by authorised staff.</p>
          ) : null}
          {incident.possibleReportableIncident ? (
            <p className="mt-1">
              Possible reportable incident — requires human review; not auto-submitted
              to the NDIS Commission.
            </p>
          ) : null}
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold">What you reported</h2>
          <p className="text-sm text-muted-foreground">
            Submitted {format(new Date(incident.createdAt), "d MMM yyyy HH:mm")}
            {incident.reportedByName ? ` · Reported by ${incident.reportedByName}` : ""}
          </p>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{incident.description}</p>
        </CardContent>
      </Card>

      {incident.resolutionSummary ? (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Resolution</h2>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{incident.resolutionSummary}</p>
            {incident.closedAt ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Closed {format(new Date(incident.closedAt), "d MMM yyyy")}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          Your report is being reviewed. You will be notified when there is an update.
        </p>
      )}

      {incident.updates.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-semibold">Updates</h2>
          <ul className="space-y-2">
            {incident.updates.map((u) => (
              <li key={u.id} className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm">{u.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {format(new Date(u.createdAt), "d MMM yyyy HH:mm")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
