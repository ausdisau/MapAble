import { WorkflowRunTable } from "@/components/workflows/WorkflowRunTable";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminWorkflowsPage() {
  await requireAdmin();

  const runs = await prisma.workflowRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Workflow runs</h1>
      <p className="text-sm text-muted-foreground">
        Critical deadlines (complaints, incidents, credentials) run through
        Temporal or local mirror when Temporal is disabled.
      </p>
      <WorkflowRunTable runs={runs} />
    </div>
  );
}
