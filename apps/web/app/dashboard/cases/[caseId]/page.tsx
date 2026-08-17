import { format } from "date-fns";
import { notFound, redirect } from "next/navigation";

import { CaseDetailClient } from "@/components/cases/CaseDetailClient";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAuth } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { canUserAccessCase, canUserManageCase } from "@/lib/cases/case-access";
import { caseManagementConfig } from "@/lib/config/case-management";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  if (!caseManagementConfig.enabled) {
    redirect("/dashboard/cases");
  }

  const { caseId } = await params;
  const user = await requireAuth();

  const row = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      notes: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { createdAt: "desc" } },
      insights: { orderBy: { createdAt: "desc" } },
      participant: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  if (!row) notFound();
  if (!canUserAccessCase(row, user.id, user.primaryRole)) notFound();

  const canManage = canUserManageCase(row, user.id, user.primaryRole);
  const canRunAI = hasPermission(user.primaryRole, "case:ai:run");

  const notes = row.notes.map((n) => ({
    id: n.id,
    body: n.body,
    createdAt: n.createdAt.toISOString(),
    pinned: n.pinned,
  }));
  const tasks = row.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    details: t.details,
    status: t.status,
    priority: t.priority,
    dueAt: t.dueAt ? t.dueAt.toISOString() : null,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    aiSuggested: t.aiSuggested,
  }));
  const insights = row.insights.map((i) => ({
    id: i.id,
    kind: i.kind,
    summary: i.summary,
    confidence: i.confidence,
    requiresReview: i.requiresReview,
    createdAt: i.createdAt.toISOString(),
    acknowledgedAt: i.acknowledgedAt ? i.acknowledgedAt.toISOString() : null,
    engine: i.engine,
    detailJson: i.detailJson,
  }));

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {row.reference}
          </span>
          <h1 className="font-heading text-2xl font-bold">{row.title}</h1>
          <StatusBadge status={row.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {row.category.replaceAll("_", " ")} · {row.priority} priority · risk{" "}
          {row.riskLevel} · opened {format(row.createdAt, "d MMM yyyy")}
          {row.participant ? ` · participant ${row.participant.name}` : ""}
          {row.assignedTo ? ` · owner ${row.assignedTo.name}` : " · unassigned"}
        </p>
        {row.description ? (
          <p className="whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-sm">
            {row.description}
          </p>
        ) : null}
      </header>

      <CaseDetailClient
        caseId={row.id}
        notes={notes}
        tasks={tasks}
        insights={insights}
        canManage={canManage}
        canRunAI={canRunAI}
        aiEnabled={caseManagementConfig.aiEnabled}
      />
    </div>
  );
}
