import { format } from "date-fns";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { requireAuth } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { caseListWhereForUser } from "@/lib/cases/case-access";
import { caseManagementConfig } from "@/lib/config/case-management";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Cases | AI-Enabled Case Management",
};
export const dynamic = "force-dynamic";

export default async function CasesIndexPage() {
  if (!caseManagementConfig.enabled) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h1 className="font-heading text-2xl font-bold">Case management</h1>
        <p className="mt-2 text-muted-foreground">
          The case management module is disabled in this environment. Set
          <code className="ml-1 rounded bg-muted px-1">
            CASE_MANAGEMENT_ENABLED=true
          </code>{" "}
          to enable.
        </p>
      </div>
    );
  }

  const user = await requireAuth();
  const canManage =
    hasPermission(user.primaryRole, "case:manage:self") ||
    hasPermission(user.primaryRole, "case:manage:any");

  const cases = await prisma.case.findMany({
    where: caseListWhereForUser(user.id, user.primaryRole),
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      participant: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      _count: { select: { tasks: true, notes: true, insights: true } },
    },
  });

  const openCount = cases.filter((c) => c.status !== "closed").length;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            AI-Enabled case management
          </h1>
          <p className="text-muted-foreground">
            {openCount > 0
              ? `${openCount} open case(s) of ${cases.length} total.`
              : "No open cases."}{" "}
            AI insights are advisory only and require human review before
            escalation.
          </p>
        </div>
        {canManage ? (
          <Link
            href="/dashboard/cases/new"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open a new case
          </Link>
        ) : null}
      </header>

      {caseManagementConfig.aiEnabled ? (
        <NaturalLanguageSearch />
      ) : (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          AI features are turned off for this environment.
        </p>
      )}

      {cases.length === 0 ? (
        <p className="text-muted-foreground">
          You have no cases yet.
          {canManage ? " Use the button above to open one." : ""}
        </p>
      ) : (
        <ul className="space-y-3">
          {cases.map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/cases/${c.id}`}
                className="block rounded-lg border border-border bg-card p-4 transition hover:border-primary/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {c.reference}
                  </span>
                  <span className="font-medium">{c.title}</span>
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority} />
                  <RiskBadge level={c.riskLevel} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {c.category.replaceAll("_", " ")} ·{" "}
                  {c.participant
                    ? `Participant: ${c.participant.name}`
                    : "No participant linked"}
                  {" · "}
                  {c.assignedTo
                    ? `Owner: ${c.assignedTo.name}`
                    : "Unassigned"}{" "}
                  ·{" "}
                  {c._count.tasks > 0
                    ? `${c._count.tasks} task(s)`
                    : "no tasks"}{" "}
                  ·{" "}
                  {c._count.insights > 0
                    ? `${c._count.insights} AI insight(s)`
                    : "no AI run yet"}{" "}
                  · opened {format(c.createdAt, "d MMM yyyy")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-blue-100 text-blue-900",
    high: "bg-amber-100 text-amber-900",
    urgent: "bg-red-100 text-red-900",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[priority] ?? styles.medium}`}
    >
      {priority}
    </span>
  );
}

function RiskBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    moderate: "bg-blue-100 text-blue-900",
    elevated: "bg-amber-100 text-amber-900",
    high: "bg-orange-100 text-orange-900",
    critical: "bg-red-100 text-red-900",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[level] ?? styles.low}`}
    >
      risk: {level}
    </span>
  );
}

function NaturalLanguageSearch() {
  return (
    <form
      action="/dashboard/cases"
      method="get"
      className="rounded-xl border border-border bg-muted/30 p-4"
    >
      <label className="block text-sm font-medium" htmlFor="case-nl-search">
        Ask the AI about your cases
      </label>
      <p className="text-xs text-muted-foreground">
        e.g. &ldquo;show me high-risk cases about housing&rdquo;. Search is
        rules-based and runs locally — see{" "}
        <code className="rounded bg-muted px-1">docs/modules/case-management.md</code>{" "}
        for details.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          id="case-nl-search"
          name="q"
          type="search"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Describe what you’re looking for"
        />
        <Link
          href="/dashboard/cases/search"
          className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          Open AI search
        </Link>
      </div>
    </form>
  );
}
